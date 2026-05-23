import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNowPlaying } from '@/hooks/queries/useNowPlaying'
import { usePlayer } from '@/hooks/usePlayer'
import { useAuth } from '@/hooks/useAuth'
import { extractPalette } from '@/lib/colorThief'

export function PlayerSync() {
  const { state: authState } = useAuth()
  const { state, dispatch } = usePlayer()
  const queryClient = useQueryClient()
  const { data } = useNowPlaying(authState.isAuthenticated)
  const lastTrackIdRef = useRef<string | null>(null)
  
  // Usar ref para evitar que o setInterval seja reiniciado constantemente
  const isPlayingRef = useRef(state.isPlaying)
  useEffect(() => {
    isPlayingRef.current = state.isPlaying
  }, [state.isPlaying])

  // Timer local: incrementa progress a cada 1s enquanto tocando
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlayingRef.current) {
        dispatch({ type: 'TICK_PROGRESS' })
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [dispatch])

  // Sincronizar com API Spotify (corrige drift)
  useEffect(() => {
    if (!data) return

    const remote = data.item
    const localId = state.currentTrack?.id

    if (remote && remote.id !== localId) {
      dispatch({ type: 'SET_TRACK', payload: remote })
      queryClient.invalidateQueries({ queryKey: ['recently-played'] })
    }

    if (data.is_playing !== state.isPlaying) {
      dispatch({ type: 'SET_PLAYING', payload: data.is_playing })
    }

    if (data.progress_ms !== null) {
      const drift = Math.abs(data.progress_ms - state.progress)
      // Reduzimos o drift aceitável para sincronizar mais frequentemente se necessário
      if (drift > 2000) {
        dispatch({ type: 'SET_PROGRESS', payload: data.progress_ms })
      }
    }

    if (data.shuffle_state !== state.shuffle) {
      dispatch({ type: 'SET_SHUFFLE', payload: data.shuffle_state })
    }

    if (data.repeat_state !== state.repeat) {
      dispatch({ type: 'SET_REPEAT', payload: data.repeat_state })
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Extração de paleta
  useEffect(() => {
    const track = state.currentTrack
    if (!track || track.id === lastTrackIdRef.current) return
    lastTrackIdRef.current = track.id

    const imageUrl = track.album.images[0]?.url
    if (!imageUrl) return

    extractPalette(imageUrl).then(palette => {
      if (palette) dispatch({ type: 'SET_PALETTE', payload: palette })
    })
  }, [state.currentTrack, dispatch])

  return null
}

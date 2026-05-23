// src/hooks/usePlayerSync.ts
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNowPlaying } from '@/hooks/queries/useNowPlaying'
import { usePlayer } from '@/hooks/usePlayer'
import { useAuth } from '@/hooks/useAuth'
import { extractPalette } from '@/lib/colorThief'

export function usePlayerSync() {
  const { state: authState } = useAuth()
  const { state, dispatch } = usePlayer()
  const queryClient = useQueryClient()
  const { data } = useNowPlaying(authState.isAuthenticated)
  const lastTrackIdRef = useRef<string | null>(null)
  
  // Timer local: incrementa progress a cada 100ms enquanto tocando
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isPlaying) {
        dispatch({ type: 'TICK_PROGRESS', payload: 100 })
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [dispatch, state.isPlaying])

  // Sincronizar com API Spotify
  useEffect(() => {
    if (!data) return

    const remote = data.item
    const localId = state.currentTrack?.id

    // Troca de música
    if (remote && remote.id !== localId) {
      dispatch({ type: 'SET_TRACK', payload: remote })
      queryClient.invalidateQueries({ queryKey: ['recently-played'] })
    }

    // Estado de play/pause
    if (data.is_playing !== state.isPlaying) {
      dispatch({ type: 'SET_PLAYING', payload: data.is_playing })
    }

    // Progresso e Drift
    if (data.progress_ms !== null) {
      // Ignorar se houve seek manual recente (2s)
      const isRecentlySeeked = Date.now() - state.lastSeekTime < 2000
      
      if (!isRecentlySeeked) {
        const adjustedProgress = data.is_playing 
          ? data.progress_ms + (Date.now() - data.timestamp)
          : data.progress_ms

        const drift = Math.abs(adjustedProgress - state.progress)
        
        // Sync se drift > 1s
        if (drift > 1000) {
          dispatch({ type: 'SET_PROGRESS', payload: adjustedProgress })
        }
      }
    }

    // Shuffle / Repeat
    if (data.shuffle_state !== state.shuffle) {
      dispatch({ type: 'SET_SHUFFLE', payload: data.shuffle_state })
    }
    if (data.repeat_state !== state.repeat) {
      dispatch({ type: 'SET_REPEAT', payload: data.repeat_state })
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Extração de paleta (cores do fundo)
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
}

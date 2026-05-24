import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNowPlaying } from '@/hooks/queries/useNowPlaying'
import { useQueue } from '@/hooks/queries/useQueue'
import { usePlayer } from '@/hooks/usePlayer'
import { useAuth } from '@/hooks/useAuth'
import { extractPalette } from '@/lib/colorThief'
import type { SpotifyTrack } from '@/types/spotify'

interface RecentlyPlayedItem {
  track: SpotifyTrack
  played_at: string
}

export function usePlayerSync() {
  const { state: authState } = useAuth()
  const { state, dispatch } = usePlayer()
  const queryClient = useQueryClient()
  
  const { data } = useNowPlaying(authState.isAuthenticated)
  const { data: queueData } = useQueue(authState.isAuthenticated)
  
  const lastTrackIdRef = useRef<string | null>(null)

  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state })

  useEffect(() => {
    const s = stateRef.current

    // Se o player estiver inativo (204), apenas limpamos o estado de reprodução
    if (!data) {
      if (s.isPlaying) dispatch({ type: 'SET_PLAYING', payload: false })
      return
    }

    const remote = data.item
    const localId = s.currentTrack?.id

    if (remote && remote.id !== localId) {
      dispatch({ type: 'SET_TRACK', payload: remote })
      queryClient.setQueriesData<RecentlyPlayedItem[]>(
        { queryKey: ['recently-played'] },
        (old) => {
          if (!old) return old
          const entry: RecentlyPlayedItem = { track: remote, played_at: new Date().toISOString() }
          return [entry, ...old.filter((i) => i.track.id !== remote.id)].slice(0, old.length)
        }
      )
    }

    if (data.is_playing !== s.isPlaying) {
      dispatch({ type: 'SET_PLAYING', payload: data.is_playing })
    }

    if (data.shuffle_state !== s.shuffle) {
      dispatch({ type: 'SET_SHUFFLE', payload: data.shuffle_state })
    }

    if (data.repeat_state !== s.repeat) {
      dispatch({ type: 'SET_REPEAT', payload: data.repeat_state })
    }
  }, [data, dispatch, queryClient])

  // Sincroniza a fila (queue)
  useEffect(() => {
    if (queueData?.queue) {
      dispatch({ type: 'SET_QUEUE', payload: queueData.queue })
    }
  }, [queueData, dispatch])

  useEffect(() => {
    const track = state.currentTrack
    if (!track || track.id === lastTrackIdRef.current) return
    lastTrackIdRef.current = track.id

    const imageUrl = track.album.images[0]?.url
    if (!imageUrl) return

    extractPalette(imageUrl).then((palette) => {
      if (palette) dispatch({ type: 'SET_PALETTE', payload: palette })
    })
  }, [state.currentTrack, dispatch])
}

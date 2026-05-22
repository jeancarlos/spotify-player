import { useEffect, useRef } from 'react'
import { useNowPlaying } from '@/hooks/queries/useNowPlaying'
import { usePlayer } from '@/hooks/usePlayer'
import { useAuth } from '@/hooks/useAuth'
import { extractPalette } from '@/lib/colorThief'

/**
 * PlayerSync — mounts inside AppShell (authenticated zone).
 * Polls GET /me/player every 5 s and syncs remote state → PlayerContext.
 * Also triggers palette extraction whenever currentTrack changes.
 * Renders nothing.
 */
export function PlayerSync() {
  const { state: authState } = useAuth()
  const { state, dispatch } = usePlayer()
  const { data } = useNowPlaying(authState.isAuthenticated)

  // Track last synced track id to avoid redundant palette extractions
  const lastTrackIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!data) return

    const remote = data.item
    const localId = state.currentTrack?.id
    const remoteId = remote?.id

    // Sync track
    if (remote && remoteId !== localId) {
      dispatch({ type: 'SET_TRACK', payload: remote })
    }

    // Sync play state
    if (data.is_playing !== state.isPlaying) {
      dispatch({ type: 'SET_PLAYING', payload: data.is_playing })
    }

    // Sync progress (only if drift > 3 s to avoid jitter with local timer)
    if (data.progress_ms !== null) {
      const drift = Math.abs(data.progress_ms - state.progress)
      if (drift > 3000) {
        dispatch({ type: 'SET_PROGRESS', payload: data.progress_ms })
      }
    }

    // Sync shuffle
    if (data.shuffle_state !== state.shuffle) {
      dispatch({ type: 'TOGGLE_SHUFFLE' })
    }

    // Sync repeat
    if (data.repeat_state !== state.repeat) {
      dispatch({ type: 'SET_REPEAT', payload: data.repeat_state })
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Palette extraction: runs whenever currentTrack changes (centralized)
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

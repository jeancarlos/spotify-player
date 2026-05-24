import { useCallback } from 'react'
import { usePlayer } from '@/hooks/usePlayer'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import api from '@/lib/axios'
import type { SpotifyTrack } from '@/types/spotify'
import type { AxiosError } from 'axios'

export function usePlayTrack() {
  const { dispatch } = usePlayer()
  const { toast } = useToast()
  const { t } = useTranslation()

  return useCallback(
    async (track: SpotifyTrack, queue: SpotifyTrack[] = []) => {
      dispatch({ type: 'SET_TRACK', payload: track })
      dispatch({ type: 'SET_PLAYING', payload: true })
      if (queue.length > 0) {
        const startIdx = queue.findIndex((t) => t.id === track.id)
        const upcomingQueue = startIdx >= 0 ? queue.slice(startIdx) : queue
        dispatch({ type: 'SET_QUEUE', payload: upcomingQueue })
      }

      try {
        await api.put('/me/player/play', { uris: [track.uri] })
      } catch (err) {
        const status = (err as AxiosError).response?.status
        if (status === 404 || status === 403) {
          toast(t('player.noActiveDevice'), 'info')
        }
      }
    },
    [dispatch, toast, t]
  )
}

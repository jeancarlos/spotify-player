import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyQueueResponse } from '@/types/spotify'

export function useQueue(enabled = true) {
  return useQuery<SpotifyQueueResponse | null>({
    queryKey: ['player-queue'],
    enabled,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      try {
        const { data } = await api.get<SpotifyQueueResponse>('/me/player/queue')
        return data
      } catch (error) {
        console.error('Error fetching queue:', error)
        return null
      }
    },
  })
}

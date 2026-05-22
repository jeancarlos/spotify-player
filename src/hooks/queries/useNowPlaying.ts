import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { PlayerState } from '@/types/spotify'

export function useNowPlaying() {
  return useQuery<PlayerState | null>({
    queryKey: ['now-playing'],
    queryFn: async () => {
      const { data, status } = await api.get<PlayerState>('/me/player')
      if (status === 204) return null
      return data
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
}

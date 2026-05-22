import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { RecentlyPlayedResponse } from '@/types/spotify'

export function useRecentlyPlayed(limit = 20) {
  return useQuery({
    queryKey: ['recently-played', limit],
    queryFn: async () => {
      const { data } = await api.get<RecentlyPlayedResponse>('/me/player/recently-played', {
        params: { limit },
      })
      return data.items
    },
  })
}

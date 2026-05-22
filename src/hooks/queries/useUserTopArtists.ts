import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { PagingObject, SpotifyArtist } from '@/types/spotify'

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

export function useUserTopArtists(timeRange: TimeRange = 'short_term', limit = 5) {
  return useQuery({
    queryKey: ['top-artists', timeRange, limit],
    queryFn: async () => {
      const { data } = await api.get<PagingObject<SpotifyArtist>>('/me/top/artists', {
        params: { time_range: timeRange, limit },
      })
      return data.items
    },
  })
}

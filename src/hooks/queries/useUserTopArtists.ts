import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/lib/axios'
import type { SpotifyArtist, TopItemsResponse } from '@/types/spotify'

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

export function useUserTopArtists(timeRange: TimeRange = 'short_term', limit = 5) {
  return useQuery<SpotifyArtist[], Error, SpotifyArtist[]>({
    queryKey: ['top-artists-full', timeRange, 10],
    staleTime: 1000 * 60 * 30,
    retry: false,
    select: (data) => data.slice(0, limit),
    queryFn: async () => {
      try {
        const { data } = await api.get<TopItemsResponse<SpotifyArtist>>('/me/top/artists', {
          params: { time_range: timeRange, limit: 10 },
        })
        return data.items
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) return []
        throw err
      }
    },
  })
}

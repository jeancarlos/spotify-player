import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyTrack, SpotifyArtist, TopItemsResponse } from '@/types/spotify'

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

export function useUserTopTracks(timeRange: TimeRange = 'short_term', limit = 10) {
  return useQuery<SpotifyTrack[]>({
    queryKey: ['top-tracks', timeRange, limit],
    queryFn: async () => {
      const { data } = await api.get<TopItemsResponse<SpotifyTrack>>('/me/top/tracks', {
        params: { time_range: timeRange, limit },
      })
      return data.items
    },
  })
}

export function useUserTopArtistsFull(timeRange: TimeRange = 'short_term', limit = 10) {
  return useQuery<SpotifyArtist[]>({
    queryKey: ['top-artists-full', timeRange, limit],
    queryFn: async () => {
      const { data } = await api.get<TopItemsResponse<SpotifyArtist>>('/me/top/artists', {
        params: { time_range: timeRange, limit },
      })
      return data.items
    },
  })
}

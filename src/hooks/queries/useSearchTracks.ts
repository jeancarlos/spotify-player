import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SearchTracksResponse, SpotifyTrack } from '@/types/spotify'

export function useSearchTracks(query: string, enabled = true) {
  return useQuery<SpotifyTrack[]>({
    queryKey: ['search-tracks', query],
    enabled: enabled && query.trim().length > 0,
    queryFn: async () => {
      const { data } = await api.get<SearchTracksResponse>('/search', {
        params: { q: query, type: 'track', limit: 5 },
      })
      return data.tracks.items
    },
  })
}

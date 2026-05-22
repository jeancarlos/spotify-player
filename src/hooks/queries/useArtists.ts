import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SearchArtistsResponse, SpotifyArtist, PagingObject } from '@/types/spotify'

export function useArtists(query: string, page: number, limit = 20) {
  return useQuery<PagingObject<SpotifyArtist>>({
    queryKey: ['artists-search', query, page],
    enabled: query.trim().length > 0,
    queryFn: async () => {
      const { data } = await api.get<SearchArtistsResponse>('/search', {
        params: { q: query, type: 'artist', limit, offset: (page - 1) * limit },
      })
      return data.artists
    },
  })
}

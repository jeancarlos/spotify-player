import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SearchArtistsResponse, SpotifyArtist, PagingObject } from '@/types/spotify'

const PAGE_SIZE = 20
const BATCH = 10

export function useArtists(query: string, page: number) {
  return useQuery<PagingObject<SpotifyArtist>>({
    queryKey: ['artists-search', query, page],
    enabled: query.trim().length > 0,
    queryFn: async () => {
      const base = (page - 1) * PAGE_SIZE
      const [a, b] = await Promise.all([
        api.get<SearchArtistsResponse>('/search', { params: { q: query, type: 'artist', limit: BATCH, offset: base } }),
        api.get<SearchArtistsResponse>('/search', { params: { q: query, type: 'artist', limit: BATCH, offset: base + BATCH } }),
      ])
      return {
        ...a.data.artists,
        items: [...a.data.artists.items, ...b.data.artists.items],
        limit: PAGE_SIZE,
      }
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SearchAlbumsResponse, SpotifyAlbumSimple, PagingObject } from '@/types/spotify'

const PAGE_SIZE = 20
const BATCH = 10

export function useSearchAlbums(query: string, page: number) {
  return useQuery<PagingObject<SpotifyAlbumSimple>>({
    queryKey: ['albums-search', query, page],
    enabled: query.trim().length > 0,
    queryFn: async () => {
      const base = (page - 1) * PAGE_SIZE
      const [a, b] = await Promise.all([
        api.get<SearchAlbumsResponse>('/search', { params: { q: query, type: 'album', limit: BATCH, offset: base } }),
        api.get<SearchAlbumsResponse>('/search', { params: { q: query, type: 'album', limit: BATCH, offset: base + BATCH } }),
      ])
      return {
        ...a.data.albums,
        items: [...a.data.albums.items, ...b.data.albums.items],
        limit: PAGE_SIZE,
      }
    },
  })
}

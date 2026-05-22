import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SearchAlbumsResponse, SpotifyAlbumSimple, PagingObject } from '@/types/spotify'

export function useSearchAlbums(query: string, page: number, limit = 20) {
  return useQuery<PagingObject<SpotifyAlbumSimple>>({
    queryKey: ['albums-search', query, page],
    enabled: query.trim().length > 0,
    queryFn: async () => {
      const { data } = await api.get<SearchAlbumsResponse>('/search', {
        params: { q: query, type: 'album', limit, offset: (page - 1) * limit },
      })
      return data.albums
    },
  })
}

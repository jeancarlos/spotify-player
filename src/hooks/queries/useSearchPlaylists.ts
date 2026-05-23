import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SearchPlaylistsResponse, SpotifyPlaylist, PagingObject } from '@/types/spotify'

const PAGE_SIZE = 20
const BATCH = 10

export function useSearchPlaylists(query: string, page: number) {
  return useQuery<PagingObject<SpotifyPlaylist | null>>({
    queryKey: ['playlists-search', query, page],
    enabled: query.trim().length > 0,
    queryFn: async () => {
      const base = (page - 1) * PAGE_SIZE
      const [a, b] = await Promise.all([
        api.get<SearchPlaylistsResponse>('/search', { params: { q: query, type: 'playlist', limit: BATCH, offset: base } }),
        api.get<SearchPlaylistsResponse>('/search', { params: { q: query, type: 'playlist', limit: BATCH, offset: base + BATCH } }),
      ])
      return {
        ...a.data.playlists,
        items: [...a.data.playlists.items, ...b.data.playlists.items],
        limit: PAGE_SIZE,
      }
    },
  })
}

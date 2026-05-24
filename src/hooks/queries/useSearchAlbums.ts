import { useSearchPaged } from './useSearchPaged'
import type { SearchAlbumsResponse, SpotifyAlbumSimple } from '@/types/spotify'

export function useSearchAlbums(query: string, page: number) {
  return useSearchPaged<SpotifyAlbumSimple, SearchAlbumsResponse>({
    queryKeyPrefix: 'albums-search',
    query,
    page,
    apiType: 'album',
    getPage: (res) => res.albums,
  })
}

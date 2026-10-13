import { useSearchPaged } from './useSearchPaged'
import { toAlbum, type DzAlbum } from '@/lib/deezerMappers'
import type { SpotifyAlbumSimple } from '@/types/spotify'

export function useSearchAlbums(query: string, page: number) {
  return useSearchPaged<DzAlbum, SpotifyAlbumSimple>({
    queryKeyPrefix: 'albums-search',
    path: 'search/album',
    query,
    page,
    map: (a) => toAlbum(a),
  })
}

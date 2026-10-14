import { useSearchPaged } from './useSearchPaged'
import { toAlbum, type DzAlbum } from '@/lib/deezerMappers'
import type { AlbumSimple } from '@/types/music'

export function useSearchAlbums(query: string, page: number) {
  return useSearchPaged<DzAlbum, AlbumSimple>({
    queryKeyPrefix: 'albums-search',
    path: 'search/album',
    query,
    page,
    map: (a) => toAlbum(a),
  })
}

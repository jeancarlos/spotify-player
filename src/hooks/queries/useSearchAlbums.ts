import { createSearchHook } from './useSearchPaged'
import { toAlbum, type DzAlbum } from '@/lib/deezerMappers'
import type { AlbumSimple } from '@/types/music'

export const useSearchAlbums = createSearchHook<DzAlbum, AlbumSimple>(
  'albums-search',
  'search/album',
  toAlbum
)

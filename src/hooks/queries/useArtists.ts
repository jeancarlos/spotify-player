import { createSearchHook } from './useSearchPaged'
import { toArtist, type DzArtist } from '@/lib/deezerMappers'
import type { Artist } from '@/types/music'

export const useArtists = createSearchHook<DzArtist, Artist>(
  'artists-search',
  'search/artist',
  toArtist
)

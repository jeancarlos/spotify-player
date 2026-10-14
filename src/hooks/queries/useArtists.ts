import { useSearchPaged } from './useSearchPaged'
import { toArtist, type DzArtist } from '@/lib/deezerMappers'
import type { Artist } from '@/types/music'

export function useArtists(query: string, page: number) {
  return useSearchPaged<DzArtist, Artist>({
    queryKeyPrefix: 'artists-search',
    path: 'search/artist',
    query,
    page,
    map: (a) => toArtist(a),
  })
}

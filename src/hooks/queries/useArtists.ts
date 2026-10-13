import { useSearchPaged } from './useSearchPaged'
import { toArtist, type DzArtist } from '@/lib/deezerMappers'
import type { SpotifyArtist } from '@/types/spotify'

export function useArtists(query: string, page: number) {
  return useSearchPaged<DzArtist, SpotifyArtist>({
    queryKeyPrefix: 'artists-search',
    path: 'search/artist',
    query,
    page,
    map: (a) => toArtist(a),
  })
}

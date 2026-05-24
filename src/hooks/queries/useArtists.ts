import { useSearchPaged } from './useSearchPaged'
import type { SearchArtistsResponse, SpotifyArtist } from '@/types/spotify'

export function useArtists(query: string, page: number) {
  return useSearchPaged<SpotifyArtist, SearchArtistsResponse>({
    queryKeyPrefix: 'artists-search',
    query,
    page,
    apiType: 'artist',
    getPage: (res) => res.artists,
  })
}

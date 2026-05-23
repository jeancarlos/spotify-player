import { useSearchPaged } from './useSearchPaged'
import type { SearchPlaylistsResponse, SpotifyPlaylist } from '@/types/spotify'

export function useSearchPlaylists(query: string, page: number) {
  return useSearchPaged<SpotifyPlaylist | null, SearchPlaylistsResponse>({
    queryKeyPrefix: 'playlists-search',
    query,
    page,
    apiType: 'playlist',
    getPage: res => res.playlists,
  })
}

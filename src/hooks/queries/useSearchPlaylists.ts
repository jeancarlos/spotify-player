import { useSearchPaged } from './useSearchPaged'
import { toPlaylist, type DzPlaylist } from '@/lib/deezerMappers'
import type { Playlist } from '@/types/music'

export function useSearchPlaylists(query: string, page: number) {
  return useSearchPaged<DzPlaylist, Playlist>({
    queryKeyPrefix: 'playlists-search',
    path: 'search/playlist',
    query,
    page,
    map: (p) => toPlaylist(p),
  })
}

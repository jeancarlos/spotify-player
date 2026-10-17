import { createSearchHook } from './useSearchPaged'
import { toPlaylist, type DzPlaylist } from '@/lib/deezerMappers'
import type { Playlist } from '@/types/music'

export const useSearchPlaylists = createSearchHook<DzPlaylist, Playlist>(
  'playlists-search',
  'search/playlist',
  toPlaylist
)

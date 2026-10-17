import { useDeezerEntity } from './useDeezerEntity'
import { toPlaylist, type DzPlaylist } from '@/lib/deezerMappers'
import type { Playlist } from '@/types/music'

export function usePlaylist(playlistId: string | undefined) {
  return useDeezerEntity<DzPlaylist, Playlist>('playlist', playlistId, toPlaylist)
}

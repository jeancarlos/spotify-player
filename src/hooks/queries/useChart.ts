import { useQuery } from '@tanstack/react-query'
import { TIME_30_MINUTES } from '@/utils/constants'
import { deezer } from '@/lib/deezer'
import {
  toAlbum,
  toArtist,
  toPage,
  toPlaylist,
  type DzAlbum,
  type DzArtist,
  type DzList,
  type DzPlaylist,
} from '@/lib/deezerMappers'
import { PAGE_SIZE } from './useSearchPaged'
import type {
  PagingObject,
  AlbumSimple,
  Artist,
  Playlist,
} from '@/types/music'

interface UseChartOptions<R, T> {
  kind: 'artists' | 'albums' | 'playlists'
  enabled: boolean
  map: (raw: R) => T
}

function useChart<R, T>({ kind, enabled, map }: UseChartOptions<R, T>) {
  return useQuery<PagingObject<T>>({
    queryKey: ['chart', kind, PAGE_SIZE],
    enabled,
    staleTime: TIME_30_MINUTES,
    queryFn: async () => {
      const list = await deezer<DzList<R>>(`chart/0/${kind}`, { limit: PAGE_SIZE })
      return toPage(list, 0, PAGE_SIZE, map)
    },
  })
}

export function useChartArtists(enabled = true) {
  return useChart<DzArtist, Artist>({ kind: 'artists', enabled, map: (a) => toArtist(a) })
}

export function useChartAlbums(enabled = true) {
  return useChart<DzAlbum, AlbumSimple>({ kind: 'albums', enabled, map: (a) => toAlbum(a) })
}

export function useChartPlaylists(enabled = true) {
  return useChart<DzPlaylist, Playlist>({
    kind: 'playlists',
    enabled,
    map: (p) => toPlaylist(p),
  })
}

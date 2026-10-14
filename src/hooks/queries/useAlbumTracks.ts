import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TIME_60_MINUTES } from '@/utils/constants'
import { deezer } from '@/lib/deezer'
import { toPage, toTrack, type DzList, type DzTrack } from '@/lib/deezerMappers'
import { albumQuery } from './useAlbum'
import type { PagingObject, Track } from '@/types/music'

export function useAlbumTracks(albumId: string | undefined, page: number, limit = 20) {
  const queryClient = useQueryClient()
  const index = (page - 1) * limit
  return useQuery<PagingObject<Track>>({
    queryKey: ['album-tracks', albumId, index, limit],
    enabled: !!albumId,
    staleTime: TIME_60_MINUTES,
    queryFn: async () => {
      const [album, list] = await Promise.all([
        queryClient.ensureQueryData(albumQuery(albumId)),
        deezer<DzList<DzTrack>>(`album/${albumId ?? ''}/tracks`, { index, limit }),
      ])
      return toPage(list, index, limit, (t) => toTrack(t, album))
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import { TIME_15_MINUTES } from '@/utils/constants'
import { deezer } from '@/lib/deezer'
import { toPage, toTrack, type DzList, type DzTrack } from '@/lib/deezerMappers'
import type { PagingObject, Track } from '@/types/music'

export function usePlaylistTracks(playlistId: string, enabled = true, page = 1, limit = 20) {
  const index = (page - 1) * limit
  return useQuery<PagingObject<Track>>({
    queryKey: ['playlist-tracks', playlistId, index, limit],
    enabled: enabled && playlistId.length > 0,
    staleTime: TIME_15_MINUTES,
    queryFn: async () => {
      const list = await deezer<DzList<DzTrack | null>>(`playlist/${playlistId}/tracks`, {
        index,
        limit,
      })
      const data = list.data.filter((t): t is DzTrack => t != null)
      return toPage({ ...list, data }, index, limit, (t) => toTrack(t))
    },
  })
}

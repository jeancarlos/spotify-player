import { useQuery } from '@tanstack/react-query'
import { TIME_30_MINUTES } from '@/utils/constants'
import { deezer } from '@/lib/deezer'
import { toTrack, type DzList, type DzTrack } from '@/lib/deezerMappers'
import type { SpotifyTrack } from '@/types/spotify'

export function useArtistTopTracks(artistId: string | undefined, limit = 10) {
  return useQuery<SpotifyTrack[]>({
    queryKey: ['artist-top-tracks', artistId, limit],
    enabled: !!artistId,
    staleTime: TIME_30_MINUTES,
    queryFn: async () => {
      const list = await deezer<DzList<DzTrack>>(`artist/${artistId ?? ''}/top`, { limit })
      return list.data.map((t) => toTrack(t))
    },
  })
}

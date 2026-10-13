import { useQuery } from '@tanstack/react-query'
import { TIME_15_MINUTES } from '@/utils/constants'
import { deezer } from '@/lib/deezer'
import { toAlbum, toPage, type DzAlbum, type DzList } from '@/lib/deezerMappers'
import type { SpotifyAlbumSimple, PagingObject } from '@/types/spotify'

export function useArtistAlbums(artistId: string | undefined, page: number, limit = 10) {
  const index = (page - 1) * limit
  return useQuery<PagingObject<SpotifyAlbumSimple>>({
    queryKey: ['artist-albums', artistId, index, limit],
    enabled: !!artistId,
    staleTime: TIME_15_MINUTES,
    queryFn: async () => {
      const list = await deezer<DzList<DzAlbum>>(`artist/${artistId ?? ''}/albums`, {
        index,
        limit,
      })
      return toPage(list, index, limit, (a) => toAlbum(a))
    },
  })
}

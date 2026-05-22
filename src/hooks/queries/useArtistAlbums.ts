import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyAlbumSimple, PagingObject } from '@/types/spotify'

export function useArtistAlbums(artistId: string | undefined, page: number, limit = 10) {
  return useQuery<PagingObject<SpotifyAlbumSimple>>({
    queryKey: ['artist-albums', artistId, page],
    enabled: !!artistId,
    queryFn: async () => {
      const { data } = await api.get<PagingObject<SpotifyAlbumSimple>>(
        `/artists/${artistId}/albums`,
        { params: { limit, offset: (page - 1) * limit, include_groups: 'album,single', market: 'BR' } }
      )
      return data
    },
  })
}

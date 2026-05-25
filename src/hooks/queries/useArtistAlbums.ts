import { useQuery } from '@tanstack/react-query'
import { TIME_15_MINUTES } from '@/utils/constants'
import api from '@/lib/axios'
import { useAuth } from '@/hooks/useAuth'
import type { SpotifyAlbumSimple, PagingObject } from '@/types/spotify'

export function useArtistAlbums(artistId: string | undefined, page: number, limit = 10) {
  const { state } = useAuth()
  const market = state.profile?.country

  return useQuery<PagingObject<SpotifyAlbumSimple>>({
    queryKey: ['artist-albums', artistId, page, market],
    enabled: !!artistId,
    staleTime: TIME_15_MINUTES,
    queryFn: async () => {
      const { data } = await api.get<PagingObject<SpotifyAlbumSimple>>(
        `/artists/${artistId}/albums`,
        {
          params: {
            limit,
            offset: (page - 1) * limit,
            include_groups: 'album,single',
            ...(market && { market }),
          },
        }
      )
      return data
    },
  })
}

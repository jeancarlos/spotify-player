import { useQuery } from '@tanstack/react-query'
import { TIME_60_MINUTES } from '@/utils/constants'
import api from '@/lib/axios'
import type { AlbumTracksResponse } from '@/types/spotify'

export function useAlbumTracks(albumId: string | undefined, page: number, limit = 20) {
  return useQuery<AlbumTracksResponse>({
    queryKey: ['album-tracks', albumId, page, limit],
    enabled: !!albumId,
    staleTime: TIME_60_MINUTES,
    queryFn: async () => {
      const { data } = await api.get<AlbumTracksResponse>(`/albums/${albumId}/tracks`, {
        params: { limit, offset: (page - 1) * limit, market: 'BR' },
      })
      return data
    },
  })
}

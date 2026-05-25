import { useQuery } from '@tanstack/react-query'
import { TIME_60_MINUTES } from '@/utils/constants'
import api from '@/lib/axios'
import type { SpotifyAlbumFull } from '@/types/spotify'

export function useAlbum(albumId: string | undefined) {
  return useQuery<SpotifyAlbumFull>({
    queryKey: ['album', albumId],
    enabled: !!albumId,
    staleTime: TIME_60_MINUTES,
    queryFn: async () => {
      const { data } = await api.get<SpotifyAlbumFull>(`/albums/${albumId}`)
      return data
    },
  })
}

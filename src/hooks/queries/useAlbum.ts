import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyAlbumFull } from '@/types/spotify'

export function useAlbum(albumId: string | undefined) {
  return useQuery<SpotifyAlbumFull>({
    queryKey: ['album', albumId],
    enabled: !!albumId,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data } = await api.get<SpotifyAlbumFull>(`/albums/${albumId}`)
      return data
    },
  })
}

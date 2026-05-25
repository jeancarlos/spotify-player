import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyArtist } from '@/types/spotify'

export function useArtist(id: string | undefined) {
  return useQuery<SpotifyArtist>({
    queryKey: ['artist', id],
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data } = await api.get<SpotifyArtist>(`/artists/${id}`)
      return data
    },
  })
}

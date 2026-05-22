import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyArtist } from '@/types/spotify'

export function useArtist(id: string) {
  return useQuery<SpotifyArtist>({
    queryKey: ['artist', id],
    queryFn: async () => {
      const { data } = await api.get<SpotifyArtist>(`/artists/${id}`)
      return data
    },
  })
}

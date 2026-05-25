import { useQuery } from '@tanstack/react-query'
import { TIME_30_MINUTES } from '@/utils/constants'
import api from '@/lib/axios'
import type { SpotifyArtist } from '@/types/spotify'

export function useArtist(id: string | undefined) {
  return useQuery<SpotifyArtist>({
    queryKey: ['artist', id],
    enabled: !!id,
    staleTime: TIME_30_MINUTES,
    queryFn: async () => {
      const { data } = await api.get<SpotifyArtist>(`/artists/${id}`)
      return data
    },
  })
}

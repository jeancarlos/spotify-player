import { useQuery } from '@tanstack/react-query'
import { TIME_30_MINUTES } from '@/utils/constants'
import { deezer } from '@/lib/deezer'
import { toArtist, type DzArtist } from '@/lib/deezerMappers'
import type { SpotifyArtist } from '@/types/spotify'

export function useArtist(id: string | undefined) {
  return useQuery<SpotifyArtist>({
    queryKey: ['artist', id],
    enabled: !!id,
    staleTime: TIME_30_MINUTES,
    queryFn: async () => toArtist(await deezer<DzArtist>(`artist/${id ?? ''}`)),
  })
}

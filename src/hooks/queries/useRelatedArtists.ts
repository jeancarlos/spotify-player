import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { RelatedArtistsResponse, SpotifyArtist } from '@/types/spotify'

export function useRelatedArtists(artistId: string | undefined) {
  return useQuery<SpotifyArtist[]>({
    queryKey: ['related-artists', artistId],
    enabled: !!artistId,
    queryFn: async () => {
      const { data } = await api.get<RelatedArtistsResponse>(
        `/artists/${artistId}/related-artists`
      )
      return data.artists
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/lib/axios'
import type { RelatedArtistsResponse, SpotifyArtist } from '@/types/spotify'

export function useRelatedArtists(artistId: string | undefined) {
  return useQuery<SpotifyArtist[]>({
    queryKey: ['related-artists', artistId],
    enabled: !!artistId,
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await api.get<RelatedArtistsResponse>(
          `/artists/${artistId}/related-artists`
        )
        return data.artists
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) return []
        throw err
      }
    },
  })
}

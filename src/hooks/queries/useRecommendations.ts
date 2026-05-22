import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyTrack } from '@/types/spotify'

interface RecommendationsResponse {
  tracks: SpotifyTrack[]
}

export function useRecommendations(seedArtistIds: string[], limit = 20) {
  return useQuery({
    queryKey: ['recommendations', seedArtistIds, limit],
    enabled: seedArtistIds.length > 0,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) })
      seedArtistIds.slice(0, 5).forEach(id => params.append('seed_artists', id))
      const { data } = await api.get<RecommendationsResponse>(`/recommendations?${params}`)
      return data.tracks
    },
  })
}

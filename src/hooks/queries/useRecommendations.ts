import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/lib/axios'
import type { SpotifyTrack } from '@/types/spotify'

interface RecommendationsResponse {
  tracks: SpotifyTrack[]
}

export function useRecommendations(seedArtistIds: string[], limit = 20) {
  return useQuery({
    queryKey: ['recommendations', seedArtistIds.join(','), limit],
    enabled: seedArtistIds.length > 0,
    retry: false,
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ limit: String(limit) })
        seedArtistIds.slice(0, 5).forEach(id => params.append('seed_artists', id))
        const { data } = await api.get<RecommendationsResponse>(`/recommendations?${params}`)
        return data.tracks
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) return []
        throw err
      }
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/lib/axios'
import type { SpotifyTrack } from '@/types/spotify'

export function useTracks(ids: string[]) {
  return useQuery<SpotifyTrack[]>({
    queryKey: ['tracks', ids.join(',')],
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 10,
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await api.get<{ tracks: SpotifyTrack[] }>('/tracks', {
          params: { ids: ids.join(',') },
        })
        return data.tracks.filter(Boolean)
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) return []
        throw err
      }
    },
  })
}

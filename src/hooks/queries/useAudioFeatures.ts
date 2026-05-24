import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/lib/axios'
import type { AudioFeatures } from '@/types/spotify'

interface AudioFeaturesResponse {
  audio_features: AudioFeatures[]
}

export function useAudioFeatures(trackIds: string[]) {
  return useQuery<AudioFeatures[]>({
    queryKey: ['audio-features', trackIds.join(',')],
    enabled: trackIds.length > 0,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await api.get<AudioFeaturesResponse>('/audio-features', {
          params: { ids: trackIds.join(',') },
        })
        return data.audio_features.filter(Boolean)
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) return []
        throw err
      }
    },
  })
}

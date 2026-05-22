import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { AudioFeatures } from '@/types/spotify'

interface AudioFeaturesResponse {
  audio_features: AudioFeatures[]
}

export function useAudioFeatures(trackIds: string[]) {
  return useQuery<AudioFeatures[]>({
    queryKey: ['audio-features', trackIds],
    enabled: trackIds.length > 0,
    queryFn: async () => {
      const { data } = await api.get<AudioFeaturesResponse>('/audio-features', {
        params: { ids: trackIds.join(',') },
      })
      return data.audio_features.filter(Boolean)
    },
  })
}

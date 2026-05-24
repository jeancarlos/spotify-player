import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyTrack } from '@/types/spotify'

interface NowPlayingResponse {
  is_playing: boolean
  progress_ms: number | null
  item: SpotifyTrack | null
  shuffle_state: boolean
  repeat_state: 'off' | 'track' | 'context'
  timestamp: number
}

export function useNowPlaying(enabled = true) {
  return useQuery<NowPlayingResponse | null>({
    queryKey: ['now-playing'],
    enabled,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    staleTime: 4000,
    queryFn: async () => {
      const { data, status } = await api.get<NowPlayingResponse>('/me/player', {
        validateStatus: (s) => s === 200 || s === 204 || s === 429,
      })
      if (status === 204 || status === 429) return null
      return data
    },
  })
}

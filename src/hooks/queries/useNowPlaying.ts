import { useQuery } from '@tanstack/react-query'
import { TIME_8_SECONDS } from '@/utils/constants'
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
    refetchInterval: (query) => {
      const data = query.state.data
      return data?.is_playing === false ? 30_000 : 10_000
    },
    refetchIntervalInBackground: false,
    staleTime: TIME_8_SECONDS,
    queryFn: async () => {
      const { data, status } = await api.get<NowPlayingResponse>('/me/player', {
        validateStatus: (s) => s === 200 || s === 204,
      })
      if (status === 204) return null
      return data
    },
  })
}

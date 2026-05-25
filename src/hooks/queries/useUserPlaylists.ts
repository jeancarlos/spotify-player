import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { TIME_15_MINUTES } from '@/utils/constants'
import api from '@/lib/axios'
import type { UserPlaylistsResponse } from '@/types/spotify'

export function useUserPlaylists(
  enabled = true,
  options?: Partial<UseQueryOptions<UserPlaylistsResponse>>
) {
  return useQuery<UserPlaylistsResponse>({
    ...options,
    queryKey: ['user-playlists'],
    enabled,
    staleTime: TIME_15_MINUTES,
    queryFn: async () => {
      const { data } = await api.get<UserPlaylistsResponse>('/me/playlists', {
        params: { limit: 20 },
      })
      return data
    },
  })
}

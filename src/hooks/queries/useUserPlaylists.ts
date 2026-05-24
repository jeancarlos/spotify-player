import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { UserPlaylistsResponse } from '@/types/spotify'

export function useUserPlaylists(
  enabled = true,
  options?: Partial<UseQueryOptions<UserPlaylistsResponse, Error>>
) {
  return useQuery<UserPlaylistsResponse, Error>({
    ...options,
    queryKey: ['user-playlists'],
    enabled,
    staleTime: 1000 * 60 * 15,
    queryFn: async () => {
      const { data } = await api.get<UserPlaylistsResponse>('/me/playlists', {
        params: { limit: 50 },
      })
      return data
    },
  })
}

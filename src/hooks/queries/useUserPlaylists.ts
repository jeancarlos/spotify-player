import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { UserPlaylistsResponse } from '@/types/spotify'

export function useUserPlaylists(enabled = true) {
  return useQuery<UserPlaylistsResponse>({
    queryKey: ['user-playlists'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<UserPlaylistsResponse>('/me/playlists', {
        params: { limit: 50 },
      })
      return data
    },
  })
}

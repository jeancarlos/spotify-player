import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { PlaylistTracksResponse } from '@/types/spotify'

export function usePlaylistTracks(
  playlistId: string,
  enabled = true,
  page = 1,
  limit = 20,
  options?: Partial<UseQueryOptions<PlaylistTracksResponse>>
) {
  return useQuery<PlaylistTracksResponse>({
    ...options,
    queryKey: ['playlist-tracks', playlistId, page, limit],
    enabled: enabled && playlistId.length > 0,
    queryFn: async () => {
      const { data } = await api.get<PlaylistTracksResponse>(`/playlists/${playlistId}/items`, {
        params: { limit, offset: (page - 1) * limit },
      })
      return data
    },
  })
}

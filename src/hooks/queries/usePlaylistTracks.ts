import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { PlaylistTracksResponse } from '@/types/spotify'

export function usePlaylistTracks(
  playlistId: string, 
  enabled = true,
  options?: Partial<UseQueryOptions<PlaylistTracksResponse, Error>>
) {
  return useQuery<PlaylistTracksResponse, Error>({
    ...options,
    queryKey: ['playlist-tracks', playlistId],
    enabled: enabled && playlistId.length > 0,
    queryFn: async () => {
      const { data } = await api.get<PlaylistTracksResponse>(
        `/playlists/${playlistId}/items`,
        { params: { limit: 50 } }
      )
      return data
    },
  })
}

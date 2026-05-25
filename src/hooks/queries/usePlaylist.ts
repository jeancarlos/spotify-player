import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyPlaylist } from '@/types/spotify'

export function usePlaylist(playlistId: string | undefined) {
  return useQuery<SpotifyPlaylist>({
    queryKey: ['playlist', playlistId],
    enabled: !!playlistId,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data } = await api.get<SpotifyPlaylist>(`/playlists/${playlistId}`, {
        params: { fields: 'id,name,description,images,owner,uri,public,snapshot_id,external_urls' },
      })
      return data
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

interface RemoveVars { playlistId: string; uris: string[] }

export function useRemoveFromPlaylist() {
  const qc = useQueryClient()
  return useMutation<void, Error, RemoveVars>({
    mutationFn: async ({ playlistId, uris }) => {
      await api.delete(`/playlists/${playlistId}/tracks`, {
        data: { tracks: uris.map(uri => ({ uri })) },
      })
    },
    onSuccess: (_data, { playlistId }) => {
      qc.invalidateQueries({ queryKey: ['playlist-tracks', playlistId] })
    },
  })
}

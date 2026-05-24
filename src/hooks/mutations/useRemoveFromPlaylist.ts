import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

interface RemoveVars {
  playlistId: string
  uris: string[]
}

export function useRemoveFromPlaylist() {
  const qc = useQueryClient()
  return useMutation<undefined, Error, RemoveVars>({
    mutationFn: async ({ playlistId, uris }) => {
      await api.delete(`/playlists/${playlistId}/items`, {
        data: { items: uris.map((uri) => ({ uri })) },
      })
    },
    onSuccess: (_data, { playlistId }) => {
      void qc.invalidateQueries({ queryKey: ['playlist-tracks', playlistId] })
    },
  })
}

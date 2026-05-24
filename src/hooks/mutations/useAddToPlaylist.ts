import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

interface AddVars {
  playlistId: string
  uris: string[]
}

export function useAddToPlaylist() {
  const qc = useQueryClient()
  return useMutation<void, Error, AddVars>({
    mutationFn: async ({ playlistId, uris }) => {
      await api.post(`/playlists/${playlistId}/items`, { uris })
    },
    onSuccess: (_data, { playlistId }) => {
      qc.invalidateQueries({ queryKey: ['playlist-tracks', playlistId] })
    },
  })
}

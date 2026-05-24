import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

interface UpdatePlaylistVars {
  playlistId: string
  name?: string
  description?: string
}

export function useUpdatePlaylist() {
  const qc = useQueryClient()
  return useMutation<undefined, Error, UpdatePlaylistVars>({
    mutationFn: async ({ playlistId, name, description }) => {
      await api.put(`/playlists/${playlistId}`, { name, description })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-playlists'] })
    },
  })
}

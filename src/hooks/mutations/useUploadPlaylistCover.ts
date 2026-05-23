import { useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'

interface UploadCoverVars {
  playlistId: string
  base64Jpeg: string
}

export function useUploadPlaylistCover() {
  return useMutation<void, Error, UploadCoverVars>({
    mutationFn: async ({ playlistId, base64Jpeg }) => {
      await api.put(`/playlists/${playlistId}/images`, base64Jpeg, {
        headers: { 'Content-Type': 'image/jpeg' },
      })
    },
  })
}

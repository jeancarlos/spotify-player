import { useMutation } from '@tanstack/react-query'
import { STORAGE_KEYS } from '@/lib/storageKeys'

interface UploadCoverVars {
  playlistId: string
  base64Jpeg: string
}

export function useUploadPlaylistCover() {
  return useMutation<undefined, Error, UploadCoverVars>({
    mutationFn: async ({ playlistId, base64Jpeg }) => {
      const token = sessionStorage.getItem(STORAGE_KEYS.accessToken)
      if (!token) throw new Error('No access token available')
      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/images`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'image/jpeg',
        },
        body: base64Jpeg,
      })

      if (!res.ok) throw new Error(`Cover upload failed: ${res.status}`)
    },
  })
}

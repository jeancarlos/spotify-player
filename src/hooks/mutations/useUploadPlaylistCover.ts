import { useMutation } from '@tanstack/react-query'

interface UploadCoverVars {
  playlistId: string
  base64Jpeg: string
}

export function useUploadPlaylistCover() {
  return useMutation<void, Error, UploadCoverVars>({
    mutationFn: async ({ playlistId, base64Jpeg }) => {
      const token = sessionStorage.getItem('access_token')
      if (!token) throw new Error('Sem token de acesso')
      const res = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/images`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'image/jpeg',
          },
          body: base64Jpeg,
        },
      )
      // Spotify retorna 202 Accepted (sem body)
      if (!res.ok) throw new Error(`upload capa: ${res.status}`)
    },
  })
}

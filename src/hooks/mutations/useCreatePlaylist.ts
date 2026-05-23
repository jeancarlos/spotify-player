import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyPlaylist } from '@/types/spotify'

interface CreatePlaylistVars {
  userId: string
  name: string
  isPublic?: boolean
  description?: string
}

export function useCreatePlaylist() {
  const qc = useQueryClient()
  return useMutation<SpotifyPlaylist, Error, CreatePlaylistVars>({
    mutationFn: async ({ userId, name, isPublic = false, description = '' }) => {
      const { data } = await api.post<SpotifyPlaylist>(`/users/${userId}/playlists`, {
        name,
        public: isPublic,
        description,
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-playlists'] })
    },
  })
}

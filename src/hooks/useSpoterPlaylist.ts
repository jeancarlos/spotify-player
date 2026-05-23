import { useState, useEffect, useMemo } from 'react'
import type { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlaylists } from '@/hooks/queries/useUserPlaylists'
import { usePlaylistTracks } from '@/hooks/queries/usePlaylistTracks'
import { useCreatePlaylist } from '@/hooks/mutations/useCreatePlaylist'
import { useAddToPlaylist } from '@/hooks/mutations/useAddToPlaylist'
import { useRemoveFromPlaylist } from '@/hooks/mutations/useRemoveFromPlaylist'

const STORAGE_KEY = 'spoter_playlist_id'

export function useSpoterPlaylist() {
  const { t } = useTranslation()
  const { state: authState } = useAuth()
  const userId = authState.profile?.id ?? ''

  const playlistName = useMemo(() => t('playlist.defaultName'), [t])

  const [playlistId, setPlaylistId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ''
  )

  const playlists = useUserPlaylists(!!userId)
  const createPlaylist = useCreatePlaylist()
  const addMutation = useAddToPlaylist()
  const removeMutation = useRemoveFromPlaylist()
  const tracks = usePlaylistTracks(playlistId)

  useEffect(() => {
    if (!playlists.data || playlistId) return

    // Busca por nome exato da playlist (pode variar se o usuário mudou o idioma)
    // No entanto, o ID é persistido no localStorage para evitar duplicatas
    const existing = playlists.data.items.find(p => p.name === playlistName)
    if (existing) {
      setPlaylistId(existing.id)
      localStorage.setItem(STORAGE_KEY, existing.id)
    } else if (userId) {
      createPlaylist.mutate(
        { userId, name: playlistName, isPublic: false },
        {
          onSuccess: playlist => {
            setPlaylistId(playlist.id)
            localStorage.setItem(STORAGE_KEY, playlist.id)
          },
        }
      )
    }
  }, [playlists.data, playlistId, userId, playlistName, createPlaylist])

  // ID salvo pode estar desatualizado (playlist deletada no Spotify)
  useEffect(() => {
    if (!tracks.isError || !playlistId) return
    const status = (tracks.error as AxiosError).response?.status
    if (status === 404) {
      setPlaylistId('')
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [tracks.isError, tracks.error, playlistId])

  const addTrack = (uri: string) => {
    if (playlistId) addMutation.mutate({ playlistId, uris: [uri] })
  }

  const removeTrack = (uri: string) => {
    if (playlistId) removeMutation.mutate({ playlistId, uris: [uri] })
  }

  return {
    playlistId,
    tracks: tracks.data?.items.map(i => i.item) ?? [],
    addTrack,
    removeTrack,
    isLoading: !playlistId || tracks.isLoading,
  }
}

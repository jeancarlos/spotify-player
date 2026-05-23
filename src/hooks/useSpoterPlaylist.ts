import { useState, useEffect, useMemo, useRef } from 'react'
import type { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlaylists } from '@/hooks/queries/useUserPlaylists'
import { usePlaylistTracks } from '@/hooks/queries/usePlaylistTracks'
import { useCreatePlaylist } from '@/hooks/mutations/useCreatePlaylist'
import { useAddToPlaylist } from '@/hooks/mutations/useAddToPlaylist'
import { useRemoveFromPlaylist } from '@/hooks/mutations/useRemoveFromPlaylist'
import { useUploadPlaylistCover } from '@/hooks/mutations/useUploadPlaylistCover'
import spoterListCover from '@/assets/spoterListCover'

const STORAGE_KEY = 'spoter_playlist_id'

export function useSpoterPlaylist() {
  const { t } = useTranslation()
  const { state: authState } = useAuth()
  const userId = authState.profile?.id ?? ''
  const displayName = authState.profile?.display_name ?? ''
  const playlistName = useMemo(
    () => displayName ? `${displayName}'s ${t('playlist.defaultName')}` : t('playlist.defaultName'),
    [displayName, t],
  )

  const [forcedId, setForcedId] = useState<string | null>(null)
  const createAttempted = useRef(false)

  const playlists = useUserPlaylists(!!userId)
  const createPlaylist = useCreatePlaylist()
  const uploadCover = useUploadPlaylistCover()
  const addMutation = useAddToPlaylist()
  const removeMutation = useRemoveFromPlaylist()

  // Determina o ID ativo sem precisar de useEffect para sincronizar estado síncrono
  const playlistId = useMemo(() => {
    if (forcedId !== null) return forcedId
    
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved

    if (playlists.data) {
      const found = playlists.data.items.find(p => p.name === playlistName)
      if (found) {
        // Side effect in memo is usually bad but here it's just a cache
        // We don't call setState here.
        return found.id
      }
    }

    return ''
  }, [forcedId, playlists.data, playlistName])

  // Persist discovery
  useEffect(() => {
    if (playlistId && !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, playlistId)
    }
  }, [playlistId])

  // Create playlist if missing — guarda com ref pra não repetir em re-renders
  useEffect(() => {
    if (!playlists.isSuccess || playlistId || !userId || createAttempted.current) return

    createAttempted.current = true
    createPlaylist.mutate({ userId, name: playlistName }, {
      onSuccess: (p) => {
        localStorage.setItem(STORAGE_KEY, p.id)
        setForcedId(p.id)
        uploadCover.mutate({ playlistId: p.id, base64Jpeg: spoterListCover })
      },
      onError: () => {
        createAttempted.current = false
      },
    })
  }, [playlists.isSuccess, playlistId, userId, playlistName, createPlaylist, uploadCover])

  const tracksQuery = usePlaylistTracks(playlistId, !!playlistId)

  // Handle 404 - using setTimeout to avoid "setState in effect" sync error
  // or just using the result of the query in the next render.
  useEffect(() => {
    if (tracksQuery.isError && (tracksQuery.error as AxiosError).response?.status === 404) {
      localStorage.removeItem(STORAGE_KEY)
      createAttempted.current = false
      setTimeout(() => setForcedId(''), 0)
    }
  }, [tracksQuery.isError, tracksQuery.error])

  const addTrack = (uri: string) => {
    if (playlistId) addMutation.mutate({ playlistId, uris: [uri] })
  }

  const removeTrack = (uri: string) => {
    if (playlistId) removeMutation.mutate({ playlistId, uris: [uri] })
  }

  return {
    playlistId,
    tracks: tracksQuery.data?.items.map(i => i.item) ?? [],
    addTrack,
    removeTrack,
    isLoading: !!userId && (!playlists.isSuccess || (!!playlistId && tracksQuery.isLoading)),
  }
}

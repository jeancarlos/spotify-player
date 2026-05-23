import { useState, useEffect, useMemo, useRef } from 'react'
import type { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlaylists } from '@/hooks/queries/useUserPlaylists'
import { usePlaylistTracks } from '@/hooks/queries/usePlaylistTracks'
import { useCreatePlaylist } from '@/hooks/mutations/useCreatePlaylist'
import { useUpdatePlaylist } from '@/hooks/mutations/useUpdatePlaylist'
import { useAddToPlaylist } from '@/hooks/mutations/useAddToPlaylist'
import { useRemoveFromPlaylist } from '@/hooks/mutations/useRemoveFromPlaylist'
import { useUploadPlaylistCover } from '@/hooks/mutations/useUploadPlaylistCover'
import spoterListCover from '@/assets/spoterListCover'

const STORAGE_KEY = 'spoter_playlist_id'
const COVER_KEY = 'spoter_cover_v2'

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
  const coverUploaded = useRef(false)

  const playlists = useUserPlaylists(!!userId)
  const createPlaylist = useCreatePlaylist()
  const updatePlaylist = useUpdatePlaylist()
  const uploadCover = useUploadPlaylistCover()
  const addMutation = useAddToPlaylist()
  const removeMutation = useRemoveFromPlaylist()

  const playlistId = useMemo(() => {
    if (forcedId !== null) return forcedId

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved

    if (playlists.data) {
      // Aceita nome antigo "Spoter List" como fallback para migração
      const found = playlists.data.items.find(
        p => p.name === playlistName || p.name === t('playlist.defaultName'),
      )
      if (found) return found.id
    }

    return ''
  }, [forcedId, playlists.data, playlistName, t])

  // Persist discovery
  useEffect(() => {
    if (playlistId && !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, playlistId)
    }
  }, [playlistId])

  // Create playlist if missing
  useEffect(() => {
    if (!playlists.isSuccess || playlistId || !userId || createAttempted.current) return

    createAttempted.current = true
    createPlaylist.mutate({ userId, name: playlistName }, {
      onSuccess: (p) => {
        localStorage.setItem(STORAGE_KEY, p.id)
        setForcedId(p.id)
        uploadCover.mutate({ playlistId: p.id, base64Jpeg: spoterListCover }, {
          onSuccess: () => localStorage.setItem(COVER_KEY, '1'),
        })
      },
      onError: () => {
        createAttempted.current = false
      },
    })
  }, [playlists.isSuccess, playlistId, userId, playlistName, createPlaylist, uploadCover])

  // Sync nome e capa para playlists já existentes
  useEffect(() => {
    if (!playlists.isSuccess || !playlistId) return

    // Rename: idempotente — só dispara se nome diverge e displayName já carregou
    const existing = playlists.data?.items.find(p => p.id === playlistId)
    if (existing && displayName && existing.name !== playlistName) {
      updatePlaylist.mutate({ playlistId, name: playlistName })
    }

    // Capa: uma vez por sessão + flag no localStorage entre sessões
    if (!coverUploaded.current && !localStorage.getItem(COVER_KEY)) {
      coverUploaded.current = true
      uploadCover.mutate({ playlistId, base64Jpeg: spoterListCover }, {
        onSuccess: () => localStorage.setItem(COVER_KEY, '1'),
        onError: () => { coverUploaded.current = false },
      })
    }
  }, [playlists.isSuccess, playlistId, displayName, playlistName, playlists.data, updatePlaylist, uploadCover])

  const tracksQuery = usePlaylistTracks(playlistId, !!playlistId)

  useEffect(() => {
    if (tracksQuery.isError && (tracksQuery.error as AxiosError).response?.status === 404) {
      localStorage.removeItem(STORAGE_KEY)
      createAttempted.current = false
      coverUploaded.current = false
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

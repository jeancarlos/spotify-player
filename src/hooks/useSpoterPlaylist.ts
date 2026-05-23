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

const LEGACY_KEY = 'spoter_playlist_id'

const storageKey = (userId: string) => `spoter_playlist_${userId}`
const coverKey   = (userId: string) => `spoter_cover_v2_${userId}`

export function useSpoterPlaylist() {
  const { t } = useTranslation()
  const { state: authState } = useAuth()
  const userId      = authState.profile?.id ?? ''
  const displayName = authState.profile?.display_name ?? ''

  const playlistName = useMemo(
    () => displayName ? `${displayName.charAt(0).toUpperCase() + displayName.slice(1)}'s ${t('playlist.defaultName')}` : t('playlist.defaultName'),
    [displayName, t],
  )

  const [forcedId, setForcedId] = useState<string | null>(null)
  const createAttempted = useRef(false)
  const coverUploaded   = useRef(false)

  const playlists      = useUserPlaylists(!!userId)
  const createPlaylist = useCreatePlaylist()
  const updatePlaylist = useUpdatePlaylist()
  const uploadCover    = useUploadPlaylistCover()
  const addMutation    = useAddToPlaylist()
  const removeMutation = useRemoveFromPlaylist()

  // Migra chave antiga (shared) para chave por usuário
  useEffect(() => {
    if (!userId) return
    const key = storageKey(userId)
    if (!localStorage.getItem(key)) {
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        localStorage.setItem(key, legacy)
        localStorage.removeItem(LEGACY_KEY)
      }
    }
  }, [userId])

  const playlistId = useMemo(() => {
    if (forcedId !== null) return forcedId
    if (!userId) return ''

    const saved = localStorage.getItem(storageKey(userId))
    if (saved) return saved

    if (playlists.data) {
      const found = playlists.data.items.find(p => p.name === playlistName)
      if (found) return found.id
    }

    return ''
  }, [forcedId, userId, playlists.data, playlistName])

  // Persiste ID quando descoberto por nome
  useEffect(() => {
    if (!userId || !playlistId) return
    const key = storageKey(userId)
    if (!localStorage.getItem(key)) localStorage.setItem(key, playlistId)
  }, [userId, playlistId])

  // Cria playlist se não existe
  useEffect(() => {
    if (!playlists.isSuccess || playlistId || !userId || createAttempted.current) return

    createAttempted.current = true
    createPlaylist.mutate({ userId, name: playlistName }, {
      onSuccess: (p) => {
        localStorage.setItem(storageKey(userId), p.id)
        setForcedId(p.id)
        uploadCover.mutate({ playlistId: p.id, base64Jpeg: spoterListCover }, {
          onSuccess: () => localStorage.setItem(coverKey(userId), '1'),
        })
      },
      onError: () => { createAttempted.current = false },
    })
  }, [playlists.isSuccess, playlistId, userId, playlistName, createPlaylist, uploadCover])

  const resetStalePlaylist = (uid: string) => {
    localStorage.removeItem(storageKey(uid))
    createAttempted.current = false
    coverUploaded.current   = false
    setForcedId(null)
  }

  // Sincroniza nome e capa de playlists já existentes
  useEffect(() => {
    if (!playlists.isSuccess || !playlistId || !userId) return

    // Se o ID salvo não existe mais nas playlists do usuário → resetar
    const existing = playlists.data?.items.find(p => p.id === playlistId)
    if (!existing) {
      resetStalePlaylist(userId)
      return
    }

    if (displayName && existing.name !== playlistName) {
      updatePlaylist.mutate({ playlistId, name: playlistName })
    }

    if (!coverUploaded.current && !localStorage.getItem(coverKey(userId))) {
      coverUploaded.current = true
      uploadCover.mutate({ playlistId, base64Jpeg: spoterListCover }, {
        onSuccess: () => localStorage.setItem(coverKey(userId), '1'),
        onError:   () => { coverUploaded.current = false },
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlists.isSuccess, playlistId, userId, displayName, playlistName, playlists.data, updatePlaylist, uploadCover])

  const tracksQuery = usePlaylistTracks(playlistId, !!playlistId, 1, 50)

  useEffect(() => {
    if (tracksQuery.isError && (tracksQuery.error as AxiosError).response?.status === 404) {
      if (userId) localStorage.removeItem(storageKey(userId))
      createAttempted.current = false
      coverUploaded.current   = false
      setTimeout(() => setForcedId(''), 0)
    }
  }, [tracksQuery.isError, tracksQuery.error, userId])

  const addTrack    = (uri: string) => { if (playlistId) addMutation.mutate({ playlistId, uris: [uri] }) }
  const removeTrack = (uri: string) => { if (playlistId) removeMutation.mutate({ playlistId, uris: [uri] }) }

  return {
    playlistId,
    playlistName,
    tracks: tracksQuery.data?.items.map(i => i.item) ?? [],
    addTrack,
    removeTrack,
    isLoading: !!userId && (!playlists.isSuccess || (!!playlistId && tracksQuery.isLoading)),
  }
}

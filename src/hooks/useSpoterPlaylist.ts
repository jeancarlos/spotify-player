import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlaylists } from '@/hooks/queries/useUserPlaylists'
import { usePlaylistTracks } from '@/hooks/queries/usePlaylistTracks'
import { useCreatePlaylist } from '@/hooks/mutations/useCreatePlaylist'
import { useUpdatePlaylist } from '@/hooks/mutations/useUpdatePlaylist'
import { useAddToPlaylist } from '@/hooks/mutations/useAddToPlaylist'
import { useRemoveFromPlaylist } from '@/hooks/mutations/useRemoveFromPlaylist'
import { useUploadPlaylistCover } from '@/hooks/mutations/useUploadPlaylistCover'
import { useToast } from '@/components/ui/toast'
import api from '@/lib/axios'
import { readLocalTracks } from '@/utils/favStorage'
import spoterListCover from '@/assets/spoterListCover'
import { useFavoriteStorage } from '@/hooks/useFavoriteStorage'
import type { SpotifyTrack, PlaylistTracksResponse } from '@/types/spotify'

const LEGACY_KEY = 'spoter_playlist_id'
const storageKey = (userId: string) => `spoter_playlist_${userId}`
const coverKey = (userId: string) => `spoter_cover_v2_${userId}`

export function useSpoterPlaylist() {
  const { t } = useTranslation()
  const { state: authState } = useAuth()
  const userId = authState.profile?.id ?? ''
  const displayName = authState.profile?.display_name ?? ''
  const {
    tracks,
    notes,
    addTrack: addLocalTrack,
    removeTrack: removeLocalTrack,
    replaceTracks,
    isHydrating,
  } = useFavoriteStorage(userId)

  const playlistName = useMemo(
    () =>
      displayName
        ? `${displayName.charAt(0).toUpperCase() + displayName.slice(1)}'s ${t('playlist.defaultName')}`
        : t('playlist.defaultName'),
    [displayName, t]
  )

  const [storedPlaylistId, setStoredPlaylistId] = useState<string>(() =>
    userId ? (localStorage.getItem(storageKey(userId)) ?? '') : ''
  )

  const prevUserId = useRef('')
  useEffect(() => {
    if (!userId || userId === prevUserId.current) return
    prevUserId.current = userId
    setStoredPlaylistId(localStorage.getItem(storageKey(userId)) ?? '')
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const key = storageKey(userId)
    const handler = (e: StorageEvent) => {
      if (e.key === key) setStoredPlaylistId(e.newValue ?? '')
    }
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('storage', handler)
    }
  }, [userId])

  const [forcedId, setForcedId] = useState<string | null>(null)
  const createAttempted = useRef(false)
  const coverUploaded = useRef(false)

  const hasStoredId = !!userId && !!storedPlaylistId
  const playlists = useUserPlaylists(!!userId && !hasStoredId)
  const createPlaylist = useCreatePlaylist()
  const updatePlaylist = useUpdatePlaylist()
  const uploadCover = useUploadPlaylistCover()
  const addMutation = useAddToPlaylist()
  const removeMutation = useRemoveFromPlaylist()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)

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
    if (storedPlaylistId) return storedPlaylistId
    if (playlists.data) {
      const found = playlists.data.items.find(
        (p) => p.name === playlistName && p.owner.id === userId
      )
      if (found) return found.id
    }
    return ''
  }, [forcedId, userId, storedPlaylistId, playlists.data, playlistName])

  // Seed local tracks from Spotify when localStorage is empty — no playlists.isSuccess needed
  // when the ID was already stored locally.
  const seedQuery = usePlaylistTracks(
    playlistId,
    playlistId.length > 0 && tracks.length === 0,
    1,
    50
  )

  useEffect(() => {
    if (!userId || !playlistId) return
    const key = storageKey(userId)
    if (!localStorage.getItem(key)) localStorage.setItem(key, playlistId)
  }, [userId, playlistId])

  useEffect(() => {
    if (!playlists.isSuccess || playlistId || !userId || createAttempted.current) return
    createAttempted.current = true
    createPlaylist.mutate(
      { userId, name: playlistName },
      {
        onSuccess: (p) => {
          localStorage.setItem(storageKey(userId), p.id)
          setStoredPlaylistId(p.id)
          setForcedId(p.id)
          uploadCover.mutate(
            { playlistId: p.id, base64Jpeg: spoterListCover },
            {
              onSuccess: () => {
                localStorage.setItem(coverKey(userId), '1')
              },
            }
          )
        },
        onError: () => {
          createAttempted.current = false
        },
      }
    )
  }, [playlists.isSuccess, playlistId, userId, playlistName, createPlaylist, uploadCover])

  const resetStalePlaylist = (uid: string) => {
    localStorage.removeItem(storageKey(uid))
    createAttempted.current = false
    coverUploaded.current = false
    setForcedId(null)
  }

  useEffect(() => {
    if (!playlists.isSuccess || !playlistId || !userId) return
    const existing = playlists.data.items.find((p) => p.id === playlistId)
    if (!existing) {
      const id = setTimeout(() => {
        resetStalePlaylist(userId)
      }, 0)
      return () => {
        clearTimeout(id)
      }
    }
    if (displayName && existing.name !== playlistName) {
      updatePlaylist.mutate({ playlistId, name: playlistName })
    }
    if (!coverUploaded.current && !localStorage.getItem(coverKey(userId))) {
      coverUploaded.current = true
      uploadCover.mutate(
        { playlistId, base64Jpeg: spoterListCover },
        {
          onSuccess: () => {
            localStorage.setItem(coverKey(userId), '1')
          },
          onError: () => {
            coverUploaded.current = false
          },
        }
      )
    }
  }, [
    playlists.isSuccess,
    playlistId,
    userId,
    displayName,
    playlistName,
    playlists.data,
    updatePlaylist,
    uploadCover,
  ])

  // Seed local tracks from Spotify playlist when localStorage and cookie are both empty.
  // writeLocalTracks dispatches spoter:favorites-changed; the sync handler above picks it up.
  useEffect(() => {
    if (!seedQuery.isSuccess || !userId || tracks.length > 0) return
    const fetched = seedQuery.data.items.map((item) => item.item)
    if (fetched.length === 0) return
    const id = setTimeout(() => {
      if (readLocalTracks(userId).length === 0) replaceTracks(fetched)
    }, 0)
    return () => {
      clearTimeout(id)
    }
  }, [seedQuery.isSuccess, seedQuery.data, userId, tracks.length, replaceTracks])

  const addTrack = useCallback(
    (track: SpotifyTrack, note?: string) => {
      const addedLocally = addLocalTrack(track, note)
      if (addedLocally && playlistId) addMutation.mutate({ playlistId, uris: [track.uri] })
    },
    [playlistId, addMutation, addLocalTrack]
  )

  const removeTrack = useCallback(
    (uri: string) => {
      const removedLocally = removeLocalTrack(uri)
      if (removedLocally && playlistId) removeMutation.mutate({ playlistId, uris: [uri] })
    },
    [playlistId, removeMutation, removeLocalTrack]
  )

  const refresh = useCallback(async () => {
    if (!playlistId || !userId) return
    setIsRefreshing(true)
    try {
      const { data } = await api.get<PlaylistTracksResponse>(`/playlists/${playlistId}/items`, {
        params: { limit: 50, offset: 0 },
      })
      const refreshedTracks = data.items.map((item) => item.item)
      replaceTracks(refreshedTracks)
    } catch {
      toast(t('favorites.refreshError'), 'error')
    } finally {
      setIsRefreshing(false)
    }
  }, [playlistId, userId, toast, t, replaceTracks])

  return {
    playlistId,
    playlistName,
    tracks,
    notes,
    addTrack,
    removeTrack,
    refresh,
    isRefreshing,
    isLoading: isHydrating && tracks.length === 0,
    isLocallyStored: tracks.length > 0,
  }
}

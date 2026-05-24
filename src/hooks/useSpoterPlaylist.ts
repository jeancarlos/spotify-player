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
import { useReorderPlaylistTracks } from '@/hooks/mutations/useReorderPlaylistTracks'
import { useToast } from '@/components/ui/toast'
import api from '@/lib/axios'
import {
  readLocalTracks,
  writeLocalTracks,
  readLocalNotes,
  writeLocalNotes,
} from '@/utils/favStorage'
import { readFavCookie, writeFavCookie } from '@/utils/favCookie'
import { hydrateFromApi } from '@/utils/favHydration'
import spoterListCover from '@/assets/spoterListCover'
import type { SpotifyTrack, PlaylistTracksResponse } from '@/types/spotify'

const LEGACY_KEY = 'spoter_playlist_id'
const storageKey = (userId: string) => `spoter_playlist_${userId}`
const coverKey = (userId: string) => `spoter_cover_v2_${userId}`

export function useSpoterPlaylist() {
  const { t } = useTranslation()
  const { state: authState } = useAuth()
  const userId = authState.profile?.id ?? ''
  const displayName = authState.profile?.display_name ?? ''

  const playlistName = useMemo(
    () =>
      displayName
        ? `${displayName.charAt(0).toUpperCase() + displayName.slice(1)}'s ${t('playlist.defaultName')}`
        : t('playlist.defaultName'),
    [displayName, t]
  )

  const [localTracks, setLocalTracks] = useState<SpotifyTrack[]>(() =>
    userId ? readLocalTracks(userId) : []
  )
  const [localNotes, setLocalNotes] = useState<Record<string, string>>(() =>
    userId ? readLocalNotes(userId) : {}
  )
  const [isHydrating, setIsHydrating] = useState(() => {
    if (!userId) return false
    const cookieEntries = readFavCookie(userId)
    if (cookieEntries.length === 0) return false
    const currentTracks = readLocalTracks(userId)
    return cookieEntries.some((e) => !currentTracks.some((t) => t.uri === e.uri))
  })

  const tracksRef = useRef(localTracks)
  const notesRef = useRef(localNotes)
  useEffect(() => {
    tracksRef.current = localTracks
  }, [localTracks])
  useEffect(() => {
    notesRef.current = localNotes
  }, [localNotes])

  const prevUserId = useRef('')
  useEffect(() => {
    if (!userId || userId === prevUserId.current) return
    prevUserId.current = userId
    setLocalTracks(readLocalTracks(userId))
    setLocalNotes(readLocalNotes(userId))
  }, [userId])

  // Keep multiple hook instances in sync when another instance writes to localStorage
  useEffect(() => {
    if (!userId) return
    const handler = () => {
      setLocalTracks(readLocalTracks(userId))
    }
    window.addEventListener('spoter:favorites-changed', handler)
    return () => {
      window.removeEventListener('spoter:favorites-changed', handler)
    }
  }, [userId])

  const [forcedId, setForcedId] = useState<string | null>(null)
  const createAttempted = useRef(false)
  const coverUploaded = useRef(false)
  const hydrationAttempted = useRef(false)

  const playlists = useUserPlaylists(!!userId)
  const createPlaylist = useCreatePlaylist()
  const updatePlaylist = useUpdatePlaylist()
  const uploadCover = useUploadPlaylistCover()
  const addMutation = useAddToPlaylist()
  const removeMutation = useRemoveFromPlaylist()
  const { toast } = useToast()
  const reorderMutation = useReorderPlaylistTracks()
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
    const saved = localStorage.getItem(storageKey(userId))
    if (saved) return saved
    if (playlists.data) {
      const found = playlists.data.items.find((p) => p.name === playlistName)
      if (found) return found.id
    }
    return ''
  }, [forcedId, userId, playlists.data, playlistName])

  const seedQuery = usePlaylistTracks(
    playlistId,
    playlistId.length > 0 && localTracks.length === 0 && playlists.isSuccess,
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

  useEffect(() => {
    if (!userId || hydrationAttempted.current) return
    hydrationAttempted.current = true

    const cookieEntries = readFavCookie(userId)
    if (cookieEntries.length === 0) return

    const currentTracks = readLocalTracks(userId)
    const missingUris = cookieEntries
      .filter((e) => !currentTracks.some((t) => t.uri === e.uri))
      .map((e) => e.uri)

    if (missingUris.length === 0) return

    void hydrateFromApi(missingUris).then((fetched) => {
      if (fetched.length > 0) {
        setLocalTracks((prev) => {
          const merged = [...prev, ...fetched.filter((ft) => !prev.some((p) => p.uri === ft.uri))]
          writeLocalTracks(userId, merged)
          return merged
        })
      }
      setIsHydrating(false)
    })
  }, [userId])

  // Seed local tracks from Spotify playlist when localStorage and cookie are both empty.
  // writeLocalTracks dispatches spoter:favorites-changed; the sync handler above picks it up.
  useEffect(() => {
    if (!seedQuery.isSuccess || !userId || localTracks.length > 0) return
    const fetched = seedQuery.data.items.map((item) => item.item)
    if (fetched.length === 0) return
    const id = setTimeout(() => {
      if (readLocalTracks(userId).length === 0) writeLocalTracks(userId, fetched)
    }, 0)
    return () => {
      clearTimeout(id)
    }
  }, [seedQuery.isSuccess, seedQuery.data, userId, localTracks.length])

  const addTrack = useCallback(
    (track: SpotifyTrack, note?: string) => {
      if (tracksRef.current.some((t) => t.uri === track.uri)) return

      const newTracks = [...tracksRef.current, track]
      const newNotes = note?.trim()
        ? { ...notesRef.current, [track.uri]: note.trim() }
        : notesRef.current

      writeLocalTracks(userId, newTracks)
      if (note?.trim()) writeLocalNotes(userId, newNotes)
      writeFavCookie(
        userId,
        newTracks.map((t) => ({ uri: t.uri, note: newNotes[t.uri] ?? '' }))
      )

      setLocalTracks(newTracks)
      if (note?.trim()) setLocalNotes(newNotes)

      if (playlistId) addMutation.mutate({ playlistId, uris: [track.uri] })
    },
    [userId, playlistId, addMutation]
  )

  const removeTrack = useCallback(
    (uri: string) => {
      const newTracks = tracksRef.current.filter((t) => t.uri !== uri)
      const { [uri]: _removed, ...rest } = notesRef.current
      const newNotes = rest

      writeLocalTracks(userId, newTracks)
      writeLocalNotes(userId, newNotes)
      writeFavCookie(
        userId,
        newTracks.map((t) => ({ uri: t.uri, note: newNotes[t.uri] ?? '' }))
      )

      setLocalTracks(newTracks)
      setLocalNotes(newNotes)

      if (playlistId) removeMutation.mutate({ playlistId, uris: [uri] })
    },
    [userId, playlistId, removeMutation]
  )

  const updateNote = useCallback(
    (uri: string, note: string) => {
      const trimmed = note.trim()
      const newNotes = trimmed
        ? { ...notesRef.current, [uri]: trimmed }
        : (() => {
            const { [uri]: _removed, ...rest } = notesRef.current
            return rest
          })()

      writeLocalNotes(userId, newNotes)
      writeFavCookie(
        userId,
        tracksRef.current.map((t) => ({ uri: t.uri, note: newNotes[t.uri] ?? '' }))
      )

      setLocalNotes(newNotes)
    },
    [userId]
  )

  const reorderTrack = useCallback(
    (fromIndex: number, toIndex: number) => {
      const clampedTo = Math.max(0, Math.min(toIndex, tracksRef.current.length - 1))
      if (fromIndex === clampedTo) return

      const insertBefore = clampedTo > fromIndex ? clampedTo + 1 : clampedTo
      const prevTracks = [...tracksRef.current]

      const newTracks = [...prevTracks]
      const [moved] = newTracks.splice(fromIndex, 1)
      newTracks.splice(clampedTo, 0, moved)

      writeLocalTracks(userId, newTracks)
      setLocalTracks(newTracks)

      if (playlistId) {
        reorderMutation.mutate(
          { playlistId, rangeStart: fromIndex, insertBefore },
          {
            onError: () => {
              writeLocalTracks(userId, prevTracks)
              setLocalTracks(prevTracks)
              toast(t('favorites.reorderError'), 'error')
            },
          }
        )
      }
    },
    [userId, playlistId, reorderMutation, toast, t]
  )

  const refresh = useCallback(async () => {
    if (!playlistId || !userId) return
    setIsRefreshing(true)
    try {
      const { data } = await api.get<PlaylistTracksResponse>(`/playlists/${playlistId}/items`, {
        params: { limit: 50, offset: 0 },
      })
      const refreshedTracks = data.items.map((item) => item.item)
      writeLocalTracks(userId, refreshedTracks)
      setLocalTracks(refreshedTracks)
    } catch {
      toast(t('favorites.refreshError'), 'error')
    } finally {
      setIsRefreshing(false)
    }
  }, [playlistId, userId, toast, t])

  return {
    playlistId,
    playlistName,
    tracks: localTracks,
    notes: localNotes,
    addTrack,
    removeTrack,
    updateNote,
    reorderTrack,
    refresh,
    isRefreshing,
    isLoading: isHydrating && localTracks.length === 0,
  }
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { normalizeTrack } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/storageKeys'
import type { Track } from '@/types/music'

interface FavoritesData {
  tracks: Track[]
  notes: Record<string, string>
}

const CHANGED_EVENT = 'spoter:favorites-changed'

const isTrack = (value: unknown): value is Track =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Track).uri === 'string' &&
  typeof (value as Track).name === 'string'

function parseNotes(notes: unknown): Record<string, string> {
  if (typeof notes !== 'object' || notes === null || Array.isArray(notes)) return {}
  return Object.fromEntries(
    Object.entries(notes).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  )
}

function parseFavorites(raw: string | null): FavoritesData {
  const empty: FavoritesData = { tracks: [], notes: {} }
  if (!raw) return empty
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return empty
    const { tracks, notes } = parsed as Record<string, unknown>
    return {
      tracks: Array.isArray(tracks) ? tracks.filter(isTrack).map(normalizeTrack) : [],
      notes: parseNotes(notes),
    }
  } catch {
    return empty
  }
}

function readFavorites(): FavoritesData {
  try {
    return parseFavorites(localStorage.getItem(STORAGE_KEYS.favorites))
  } catch {
    return { tracks: [], notes: {} }
  }
}

function writeFavorites(data: FavoritesData): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(data))
  } catch {
    return false
  }
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT))
  return true
}

export function useFavorites() {
  const { t } = useTranslation()
  const [data, setData] = useState<FavoritesData>(readFavorites)
  const dataRef = useRef(data)

  const commit = useCallback((updated: FavoritesData): boolean => {
    if (!writeFavorites(updated)) return false
    dataRef.current = updated
    setData(updated)
    return true
  }, [])

  const addTrack = useCallback(
    (track: Track, note?: string): boolean => {
      const { tracks, notes } = dataRef.current
      if (tracks.some((t) => t.uri === track.uri)) return true
      return commit({
        tracks: [{ ...track, preview_url: null }, ...tracks],
        notes: note ? { ...notes, [track.uri]: note } : notes,
      })
    },
    [commit]
  )

  const removeTrack = useCallback(
    (uri: string): boolean => {
      const { tracks, notes } = dataRef.current
      const { [uri]: _removed, ...rest } = notes
      return commit({ tracks: tracks.filter((t) => t.uri !== uri), notes: rest })
    },
    [commit]
  )

  const setNote = useCallback(
    (uri: string, note: string): boolean => {
      const { tracks, notes } = dataRef.current
      return commit({ tracks, notes: { ...notes, [uri]: note } })
    },
    [commit]
  )

  useEffect(() => {
    const sync = () => {
      const next = readFavorites()
      dataRef.current = next
      setData(next)
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === STORAGE_KEYS.favorites) sync()
    }
    window.addEventListener(CHANGED_EVENT, sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const playlistName = useMemo(() => t('playlist.defaultName'), [t])

  return {
    playlistName,
    tracks: data.tracks,
    notes: data.notes,
    addTrack,
    removeTrack,
    setNote,
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  readLocalNotes,
  readLocalTracks,
  writeLocalNotes,
  writeLocalTracks,
} from '@/utils/favStorage'
import { readFavCookie, writeFavCookie } from '@/utils/favCookie'
import { hydrateFromApi } from '@/utils/favHydration'
import type { SpotifyTrack } from '@/types/spotify'

function needsCookieHydration(userId: string): boolean {
  const cookieEntries = readFavCookie(userId)
  if (cookieEntries.length === 0) return false

  const currentTracks = readLocalTracks(userId)
  return cookieEntries.some((entry) => !currentTracks.some((track) => track.uri === entry.uri))
}

function writeFavoritesSnapshot(
  userId: string,
  tracks: SpotifyTrack[],
  notes: Record<string, string>
) {
  writeLocalTracks(userId, tracks)
  writeLocalNotes(userId, notes)
  writeFavCookie(
    userId,
    tracks.map((track) => ({ uri: track.uri, note: notes[track.uri] ?? '' }))
  )
}

export function useFavoriteStorage(userId: string) {
  const [tracks, setTracks] = useState<SpotifyTrack[]>(() =>
    userId ? readLocalTracks(userId) : []
  )
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    userId ? readLocalNotes(userId) : {}
  )
  const [isHydrating, setIsHydrating] = useState(() =>
    userId ? needsCookieHydration(userId) : false
  )

  const tracksRef = useRef(tracks)
  const notesRef = useRef(notes)
  const hydratedUserRef = useRef('')
  const previousUserRef = useRef('')

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  useEffect(() => {
    if (!userId || userId === previousUserRef.current) return

    previousUserRef.current = userId
    setTracks(readLocalTracks(userId))
    setNotes(readLocalNotes(userId))
    setIsHydrating(needsCookieHydration(userId))
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const handleFavoritesChange = () => {
      setTracks(readLocalTracks(userId))
      setNotes(readLocalNotes(userId))
    }

    window.addEventListener('spoter:favorites-changed', handleFavoritesChange)
    return () => {
      window.removeEventListener('spoter:favorites-changed', handleFavoritesChange)
    }
  }, [userId])

  useEffect(() => {
    if (!userId || hydratedUserRef.current === userId) return
    hydratedUserRef.current = userId

    const cookieEntries = readFavCookie(userId)
    if (cookieEntries.length === 0) return

    const currentTracks = readLocalTracks(userId)
    const missingUris = cookieEntries
      .filter((entry) => !currentTracks.some((track) => track.uri === entry.uri))
      .map((entry) => entry.uri)

    if (missingUris.length === 0) return

    void hydrateFromApi(missingUris).then((fetchedTracks) => {
      if (fetchedTracks.length > 0) {
        setTracks((previousTracks) => {
          const mergedTracks = [
            ...previousTracks,
            ...fetchedTracks.filter(
              (fetchedTrack) => !previousTracks.some((track) => track.uri === fetchedTrack.uri)
            ),
          ]
          writeLocalTracks(userId, mergedTracks)
          return mergedTracks
        })
      }

      setIsHydrating(false)
    })
  }, [userId])

  const addTrack = useCallback(
    (track: SpotifyTrack, note?: string) => {
      if (!userId || tracksRef.current.some((currentTrack) => currentTrack.uri === track.uri)) {
        return false
      }

      const trimmedNote = note?.trim()
      const nextTracks = [...tracksRef.current, track]
      const nextNotes = trimmedNote
        ? { ...notesRef.current, [track.uri]: trimmedNote }
        : notesRef.current

      writeFavoritesSnapshot(userId, nextTracks, nextNotes)
      setTracks(nextTracks)
      setNotes(nextNotes)

      return true
    },
    [userId]
  )

  const removeTrack = useCallback(
    (uri: string) => {
      if (!userId) return false

      const nextTracks = tracksRef.current.filter((track) => track.uri !== uri)
      const { [uri]: _removedNote, ...nextNotes } = notesRef.current

      writeFavoritesSnapshot(userId, nextTracks, nextNotes)
      setTracks(nextTracks)
      setNotes(nextNotes)

      return true
    },
    [userId]
  )

  const replaceTracks = useCallback(
    (nextTracks: SpotifyTrack[]) => {
      if (!userId) return
      writeLocalTracks(userId, nextTracks)
      setTracks(nextTracks)
    },
    [userId]
  )

  return {
    tracks,
    notes,
    addTrack,
    removeTrack,
    replaceTracks,
    isHydrating,
  }
}

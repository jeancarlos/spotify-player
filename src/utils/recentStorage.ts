import { isStoredTrack, normalizeTrack } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/storageKeys'
import type { Track } from '@/types/music'

const STORAGE_KEY = STORAGE_KEYS.recent
const MAX_RECENT = 10

export function readRecent(): Track[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const tracks: unknown = JSON.parse(raw)
    return Array.isArray(tracks) ? tracks.filter(isStoredTrack).map(normalizeTrack) : []
  } catch {
    return []
  }
}

export function pushRecent(track: Track): void {
  try {
    const without = readRecent().filter((t) => t.uri !== track.uri)
    const updated = [{ ...track, preview_url: null }, ...without].slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('spoter:recent-changed'))
  } catch {
    return
  }
}

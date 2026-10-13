import type { SpotifyTrack } from '@/types/spotify'

const STORAGE_KEY = 'spoter_recent_v1'
const MAX_RECENT = 10

export function readRecent(): SpotifyTrack[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const tracks = JSON.parse(raw) as SpotifyTrack[]
    return Array.isArray(tracks) ? tracks : []
  } catch {
    return []
  }
}

export function pushRecent(track: SpotifyTrack): void {
  try {
    const without = readRecent().filter((t) => t.uri !== track.uri)
    const updated = [{ ...track, preview_url: null }, ...without].slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('spoter:recent-changed'))
  } catch {
    return
  }
}

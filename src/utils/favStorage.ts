import type { SpotifyTrack } from '@/types/spotify'

const tracksKey = (userId: string) => `spoter_favorites_${userId}`
const notesKey = (userId: string) => `spoter_fav_notes_${userId}`

export function readLocalTracks(userId: string): SpotifyTrack[] {
  try {
    const raw = localStorage.getItem(tracksKey(userId))
    return raw ? (JSON.parse(raw) as SpotifyTrack[]) : []
  } catch {
    return []
  }
}

export function writeLocalTracks(userId: string, tracks: SpotifyTrack[]): void {
  try {
    localStorage.setItem(tracksKey(userId), JSON.stringify(tracks))
    window.dispatchEvent(new CustomEvent('spoter:favorites-changed', { detail: { userId } }))
  } catch {
    /* ignore */
  }
}

export function readLocalNotes(userId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(notesKey(userId))
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function writeLocalNotes(userId: string, notes: Record<string, string>): void {
  try {
    localStorage.setItem(notesKey(userId), JSON.stringify(notes))
  } catch {
    /* ignore */
  }
}

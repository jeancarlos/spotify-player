export interface FavCookieEntry {
  uri: string
  note: string
}

// ─── EDIT HERE: cookie limits ───────────────────────────────────────────────
const NOTE_TRUNCATE = 80 // max chars for the note in the cookie
const COOKIE_BYTE_LIMIT = 3500 // bytes before omitting notes
// ─────────────────────────────────────────────────────────────────────────────

const cookieKey = (userId: string) => `spoter_fav_v1_${userId}`

export function readFavCookie(userId: string): FavCookieEntry[] {
  const key = cookieKey(userId)
  const pair = document.cookie.split('; ').find((row) => row.startsWith(`${key}=`))
  if (!pair) return []
  try {
    return JSON.parse(decodeURIComponent(pair.slice(key.length + 1))) as FavCookieEntry[]
  } catch {
    return []
  }
}

export function writeFavCookie(userId: string, entries: FavCookieEntry[]): void {
  const withNotes = entries.map((e) => ({
    uri: e.uri,
    note: e.note.slice(0, NOTE_TRUNCATE),
  }))

  let payload = JSON.stringify(withNotes)

  if (new Blob([payload]).size > COOKIE_BYTE_LIMIT) {
    payload = JSON.stringify(entries.map((e) => ({ uri: e.uri, note: '' })))
  }

  const key = cookieKey(userId)
  document.cookie = `${key}=${encodeURIComponent(payload)}; max-age=31536000; path=/; SameSite=Strict`
}

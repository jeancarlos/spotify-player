export type SearchTab = 'artista' | 'album' | 'playlist'

const STORAGE_KEY = 'last-search'

export function loadLastSearch(): { q: string; tab: SearchTab } | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
  } catch {
    return null
  }
}

export function saveLastSearch(q: string, tab: SearchTab) {
  if (q.trim()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ q, tab }))
  }
}

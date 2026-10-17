export const SEARCH_DEBOUNCE_MS = 700

export type SearchTab = 'artist' | 'album' | 'playlist'

const STORAGE_KEY = 'last-search'

function migrateTab(tab: string): SearchTab {
  if (tab === 'artista') return 'artist'
  if (tab === 'album' || tab === 'playlist') return tab
  return 'artist'
}

interface StoredSearch {
  q: string
  tab: string
}

export function loadLastSearch(): { q: string; tab: SearchTab } | null {
  try {
    const raw = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? 'null'
    ) as Partial<StoredSearch> | null
    if (typeof raw?.q !== 'string') return null
    return { q: raw.q, tab: migrateTab(String(raw.tab)) }
  } catch {
    return null
  }
}

export function saveLastSearch(q: string, tab: SearchTab) {
  if (!q.trim()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ q, tab }))
  } catch {
    return
  }
}

export type SearchTab = 'artist' | 'album' | 'playlist'

const STORAGE_KEY = 'last-search'

function migrateTab(tab: string): SearchTab {
  if (tab === 'artista') return 'artist'
  if (tab === 'album' || tab === 'playlist') return tab
  return 'artist'
}

export function loadLastSearch(): { q: string; tab: SearchTab } | null {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!raw) return null
    return { q: raw.q, tab: migrateTab(raw.tab) }
  } catch {
    return null
  }
}

export function saveLastSearch(q: string, tab: SearchTab) {
  if (q.trim()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ q, tab }))
  }
}

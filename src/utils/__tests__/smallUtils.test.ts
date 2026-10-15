import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import i18n from '@/lib/i18n'
import { formatDate } from '@/utils/formatDate'
import { loadLastSearch, saveLastSearch } from '@/utils/search'
import { currentPath, getFromPath } from '@/utils/routerState'
import { readRecent } from '@/utils/recentStorage'
import { cleanupLegacyStorage } from '@/utils/legacyCleanup'
import { STORAGE_KEYS } from '@/lib/storageKeys'

describe('formatDate', () => {
  beforeEach(() => {
    Object.defineProperty(i18n, 'language', { value: 'en-US', configurable: true })
  })

  it('returns an empty string for empty input', () => {
    expect(formatDate('')).toBe('')
  })

  it('infers year, month and day precision', () => {
    expect(formatDate('1975')).toBe('1975')
    expect(formatDate('1975-10')).toBe('October 1975')
    expect(formatDate('1975-10-31')).toBe('October 31, 1975')
  })

  it('honours an explicit precision', () => {
    expect(formatDate('1975-10-31', 'year')).toBe('1975')
    expect(formatDate('1975-10-31', 'day')).toBe('October 31, 1975')
  })

  it('returns the input when it is not a date', () => {
    expect(formatDate('garbage')).toBe('garbage')
  })
})

describe('search storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('round-trips and migrates tabs', () => {
    expect(loadLastSearch()).toBeNull()
    saveLastSearch('queen', 'album')
    expect(loadLastSearch()).toEqual({ q: 'queen', tab: 'album' })
    saveLastSearch('queen', 'playlist')
    expect(loadLastSearch()?.tab).toBe('playlist')
    localStorage.setItem('last-search', JSON.stringify({ q: 'a', tab: 'artista' }))
    expect(loadLastSearch()?.tab).toBe('artist')
    localStorage.setItem('last-search', JSON.stringify({ q: 'a', tab: 'zzz' }))
    expect(loadLastSearch()?.tab).toBe('artist')
  })

  it('ignores blank queries, bad JSON and storage failures', () => {
    saveLastSearch('   ', 'album')
    expect(localStorage.getItem('last-search')).toBeNull()
    localStorage.setItem('last-search', '{bad')
    expect(loadLastSearch()).toBeNull()
    for (const raw of ['5', '{"q":5,"tab":"album"}', '{"tab":"album"}']) {
      localStorage.setItem('last-search', raw)
      expect(loadLastSearch()).toBeNull()
    }
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    expect(() => {
      saveLastSearch('q', 'album')
    }).not.toThrow()
  })
})

describe('routerState', () => {
  it('builds the current path', () => {
    expect(currentPath({ pathname: '/a', search: '?b=1' })).toBe('/a?b=1')
  })

  it('reads from-path state defensively', () => {
    expect(getFromPath({ from: '/x' })).toBe('/x')
    expect(getFromPath({ from: 1 })).toBe('/')
    expect(getFromPath({})).toBe('/')
    expect(getFromPath(null)).toBe('/')
    expect(getFromPath('s')).toBe('/')
  })
})

describe('readRecent', () => {
  it('returns an empty list for a non-array payload', () => {
    localStorage.setItem(STORAGE_KEYS.recent, '{"a":1}')
    expect(readRecent()).toEqual([])
    localStorage.removeItem(STORAGE_KEYS.recent)
  })
})

describe('cleanupLegacyStorage failures', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('survives a throwing cookie jar', () => {
    vi.spyOn(document, 'cookie', 'get').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => {
      cleanupLegacyStorage()
    }).not.toThrow()
  })

  it('survives a throwing storage', () => {
    vi.spyOn(Object, 'keys').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => {
      cleanupLegacyStorage()
    }).not.toThrow()
  })
})

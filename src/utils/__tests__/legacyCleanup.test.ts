import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanupLegacyStorage } from '@/utils/legacyCleanup'

describe('cleanupLegacyStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('removes Spotify token, profile and PKCE keys', () => {
    const legacy = ['access_token', 'refresh_token', 'user_profile', 'pkce_verifier', 'pkce_state']
    legacy.forEach((k) => { localStorage.setItem(k, 'x'); })
    sessionStorage.setItem('access_token', 'x')
    cleanupLegacyStorage()
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.getItem('access_token')).toBeNull()
  })

  it('removes per-user favorites, notes, playlist and cover keys', () => {
    localStorage.setItem('spoter_favorites_user123', '[]')
    localStorage.setItem('spoter_fav_notes_user123', '{}')
    localStorage.setItem('spoter_playlist_user123', 'p1')
    localStorage.setItem('spoter_cover_v2_user123', '1')
    cleanupLegacyStorage()
    expect(localStorage.length).toBe(0)
  })

  it('removes the legacy cookie-based favorites', () => {
    document.cookie = 'spoter_fav_v1_u1=%5B%5D; path=/'
    cleanupLegacyStorage()
    expect(document.cookie).not.toContain('spoter_fav_v1_u1')
  })

  it('keeps spoter_favorites_v2, spoter_recent_v1, spoter_lang and unrelated keys', () => {
    localStorage.setItem('spoter_favorites_v2', '{}')
    localStorage.setItem('spoter_recent_v1', '[]')
    localStorage.setItem('spoter_lang', 'pt-BR')
    localStorage.setItem('unrelated', 'x')
    cleanupLegacyStorage()
    expect(localStorage.getItem('spoter_favorites_v2')).toBe('{}')
    expect(localStorage.getItem('spoter_recent_v1')).toBe('[]')
    expect(localStorage.getItem('spoter_lang')).toBe('pt-BR')
    expect(localStorage.getItem('unrelated')).toBe('x')
  })

  it('keeps future favorites key versions', () => {
    localStorage.setItem('spoter_favorites_v3', '{}')
    localStorage.setItem('spoter_favorites_v12', '{}')
    cleanupLegacyStorage()
    expect(localStorage.getItem('spoter_favorites_v3')).toBe('{}')
    expect(localStorage.getItem('spoter_favorites_v12')).toBe('{}')
  })

  it('does not throw when localStorage throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => { cleanupLegacyStorage(); }).not.toThrow()
  })
})

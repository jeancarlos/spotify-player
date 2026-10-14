const LEGACY_KEYS = ['access_token', 'refresh_token', 'user_profile', 'pkce_verifier', 'pkce_state']
const LEGACY_PREFIXES = ['spoter_favorites_', 'spoter_fav_notes_', 'spoter_playlist_', 'spoter_cover_v2_']
const VERSIONED_KEY = /_v\d+$/
const LEGACY_COOKIE_PREFIX = 'spoter_fav_v1_'

const isLegacyKey = (key: string) =>
  LEGACY_KEYS.includes(key) ||
  (!VERSIONED_KEY.test(key) && LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix)))

function removeLegacyStorageKeys(): void {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const store = window[name]
      Object.keys(store)
        .filter(isLegacyKey)
        .forEach((key) => { store.removeItem(key); })
    } catch {
      continue
    }
  }
}

function expireLegacyCookies(): void {
  try {
    document.cookie
      .split('; ')
      .map((row) => row.split('=')[0])
      .filter((name) => name.startsWith(LEGACY_COOKIE_PREFIX))
      .forEach((name) => {
        document.cookie = `${name}=; max-age=0; path=/`
      })
  } catch {
    return
  }
}

export function cleanupLegacyStorage(): void {
  removeLegacyStorageKeys()
  expireLegacyCookies()
}

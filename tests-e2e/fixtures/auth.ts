import { test as base, type Page } from '@playwright/test'
import { mockUser, mockArtists, mockTracks, mockAlbums, mockPlaylists, pagingOf, mockArtist } from './mock-data'

async function setupAuth(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('access_token', 'mock-token-e2e')
    localStorage.setItem('refresh_token', 'mock-refresh-e2e')
    localStorage.setItem(
      'user_profile',
      JSON.stringify({ id: 'user1', display_name: 'Test User', images: [] })
    )
  })
}

async function setupApiRoutes(page: Page) {
  await page.route('**/api.spotify.com/v1/me', (route) =>
    route.fulfill({ json: mockUser })
  )
  await page.route('**/api.spotify.com/v1/me/top/artists**', (route) =>
    route.fulfill({ json: { artists: pagingOf(mockArtists, 40) } })
  )
  await page.route('**/api.spotify.com/v1/me/top/tracks**', (route) =>
    route.fulfill({ json: { tracks: pagingOf(mockTracks) } })
  )
  await page.route('**/api.spotify.com/v1/me/player/recently-played**', (route) =>
    route.fulfill({
      json: {
        items: mockTracks.map((t) => ({
          track: t,
          played_at: '2024-01-01T00:00:00Z',
          context: null,
        })),
        next: null,
      },
    })
  )
  await page.route('**/api.spotify.com/v1/search**', (route, request) => {
    const url = new URL(request.url())
    const type = url.searchParams.get('type') ?? ''
    const q = url.searchParams.get('q') ?? ''
    const offset = Number(url.searchParams.get('offset') ?? '0')
    const limit = Number(url.searchParams.get('limit') ?? '20')
    if (type.includes('album')) {
      const filteredAlbums = mockAlbums.filter((a) =>
        a.name.toLowerCase().includes(q.toLowerCase())
      )
      const slice = filteredAlbums.slice(offset, offset + limit)
      return route.fulfill({
        json: { albums: pagingOf(slice, filteredAlbums.length, offset) },
      })
    }
    if (type.includes('playlist')) {
      const filteredPlaylists = mockPlaylists.filter((p) =>
        p.name.toLowerCase().includes(q.toLowerCase())
      )
      const slice = filteredPlaylists.slice(offset, offset + limit)
      return route.fulfill({
        json: { playlists: pagingOf(slice, filteredPlaylists.length, offset) },
      })
    }
    const filtered = mockArtists.filter((a) =>
      a.name.toLowerCase().includes(q.toLowerCase())
    )
    return route.fulfill({
      json: {
        artists: pagingOf(filtered.slice(offset, offset + limit), filtered.length, offset),
      },
    })
  })
  await page.route('**/api.spotify.com/v1/artists/*/top-tracks**', (route) =>
    route.fulfill({ json: { tracks: mockTracks } })
  )
  await page.route('**/api.spotify.com/v1/artists/*/albums**', (route) =>
    route.fulfill({ json: pagingOf(mockAlbums) })
  )
  await page.route('**/api.spotify.com/v1/artists/*/related-artists**', (route) =>
    route.fulfill({ json: { artists: [] } })
  )
  await page.route('**/api.spotify.com/v1/artists/*', (route) =>
    route.fulfill({ json: mockArtist() })
  )
  await page.route('**/api.spotify.com/v1/me/playlists**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        json: {
          id: 'e2e-playlist',
          name: 'E2E Playlist',
          public: false,
          tracks: { total: 0, href: '', items: [] },
          images: [],
          owner: { id: 'user1', display_name: 'Test User', uri: '', external_urls: { spotify: '' }, type: 'user', href: '' },
          uri: 'spotify:playlist:e2e-playlist',
          type: 'playlist',
          external_urls: { spotify: '' },
          href: '',
          snapshot_id: 'snap1',
        },
      })
    } else {
      await route.fulfill({ json: pagingOf([]) })
    }
  })
  await page.route('**/api.spotify.com/v1/playlists/*/items**', (route) =>
    route.fulfill({
      json: {
        items: [],
        limit: 50,
        offset: 0,
        total: 0,
        next: null,
        previous: null,
        href: '',
      },
    })
  )
  await page.route('**/api.spotify.com/v1/playlists/**', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ status: 202 })
    } else {
      await route.fallback()
    }
  })
  await page.route('**/api.spotify.com/v1/me/player**', (route) =>
    route.fulfill({
      json: {
        is_playing: false,
        progress_ms: 0,
        item: null,
        repeat_state: 'off',
        shuffle_state: false,
      },
    })
  )
}

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await setupAuth(page)
    await setupApiRoutes(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'

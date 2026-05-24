import { test as base, type Page } from '@playwright/test'
import { mockUser, mockArtists, mockTracks, mockAlbums, pagingOf, mockArtist, mockAlbum } from './mock-data'

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
      return route.fulfill({ json: { albums: pagingOf(mockAlbums) } })
    }
    const filtered = mockArtists.filter((a) =>
      a.name.toLowerCase().includes(q.toLowerCase())
    )
    return route.fulfill({
      json: {
        artists: {
          ...pagingOf(filtered.slice(offset, offset + limit)),
          total: filtered.length,
        },
      },
    })
  })
  await page.route('**/api.spotify.com/v1/artists/*/top-tracks**', (route) =>
    route.fulfill({ json: { tracks: mockTracks } })
  )
  await page.route('**/api.spotify.com/v1/artists/*/albums**', (route) =>
    route.fulfill({ json: pagingOf(mockAlbums) })
  )
  await page.route('**/api.spotify.com/v1/artists/*', (route) =>
    route.fulfill({ json: mockArtist() })
  )
  await page.route('**/api.spotify.com/v1/me/playlists**', (route) =>
    route.fulfill({ json: pagingOf([]) })
  )
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

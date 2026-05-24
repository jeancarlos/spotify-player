import { test, expect } from './fixtures/auth'

test.describe('Artist detail page', () => {
  test.beforeEach(async ({ page }) => {
    // Silence album track queries triggered by useArtistDiscographyTracks
    await page.route('**/api.spotify.com/v1/albums/*/tracks**', (route) =>
      route.fulfill({
        json: {
          items: [],
          limit: 10,
          offset: 0,
          total: 0,
          next: null,
          previous: null,
          href: '',
        },
      })
    )
  })

  test('navigates to /artists/:id when artist card is clicked', async ({ page }) => {
    await page.goto('/artists?q=Artist&tab=artist')

    // exact: true avoids "Artist 1" matching "Artist 10", "Artist 11", etc.
    const firstCard = page.getByRole('button', { name: 'Artist 1', exact: true })
    await expect(firstCard).toBeVisible({ timeout: 15000 })
    await firstCard.click()
    await expect(page).toHaveURL(/\/artists\//, { timeout: 10000 })
  })

  test('detail page shows artist name in heading', async ({ page }) => {
    await page.goto('/artists/artist-1')

    // ArtistHeader renders name in an h1
    await expect(page.getByRole('heading', { name: 'Mock Artist' })).toBeVisible({
      timeout: 15000,
    })
  })

  test('detail page shows genre info in subtitle', async ({ page }) => {
    await page.goto('/artists/artist-1')

    // Genres joined as "pop · indie" rendered as subtitle paragraph under the h1
    await expect(page.getByText('pop · indie')).toBeVisible({ timeout: 15000 })
  })

  test('top tracks section is visible', async ({ page }) => {
    await page.goto('/artists/artist-1')

    // Chart SVG from recharts renders after artist data loads
    await expect(page.getByRole('heading', { name: 'Mock Artist' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 15000 })
  })

  test('chart SVG element is present on the page', async ({ page }) => {
    await page.goto('/artists/artist-1')

    // ArtistTopTracksChart uses recharts which renders SVG
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 15000 })
  })

  test('albums section shows album names', async ({ page }) => {
    await page.goto('/artists/artist-1')

    // ArtistDiscography renders album names as text; mock returns "Album 1" through "Album 5"
    await expect(page.getByText('Album 1', { exact: true }).first()).toBeVisible({
      timeout: 15000,
    })
  })
})

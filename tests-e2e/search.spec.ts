import { test, expect } from './fixtures/auth'

// Silence album-tracks requests triggered by discography hooks on artist detail pages
test.beforeEach(async ({ page }) => {
  await page.route('**/api.spotify.com/v1/albums/*/tracks**', (route) =>
    route.fulfill({ json: { items: [], limit: 10, offset: 0, total: 0, next: null, previous: null, href: '' } })
  )
})

// ─── SearchBar ────────────────────────────────────────────────────────────────

test.describe('SearchBar', () => {
  test('shows spinner while debounce is pending', async ({ page }) => {
    await page.goto('/artists')
    await page.fill('#global-search', 'artist')
    await expect(page.locator('[data-testid="search-spinner"]')).toBeVisible()
  })

  test('spinner disappears and search icon returns after debounce fires', async ({ page }) => {
    await page.goto('/artists')
    await page.fill('#global-search', 'artist')
    await expect(page.locator('[data-testid="search-spinner"]')).toBeVisible()
    // debounce = 700ms; 1500ms timeout gives comfortable margin
    await expect(page.locator('[data-testid="search-icon"]')).toBeVisible({ timeout: 1500 })
  })
})

// ─── Artists ──────────────────────────────────────────────────────────────────

test.describe('Artists search', () => {
  test('previous button disabled on page 1', async ({ page }) => {
    await page.goto('/artists?q=Artist&tab=artist&page=1')
    await expect(page.getByRole('button', { name: 'Artist 1', exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: /^(Previous|Anterior)$/ }).last()).toBeDisabled()
  })

  test('next button disabled when results fit in one page', async ({ page }) => {
    // "Artist 1" substring-matches Artist 1, Artist 10–19 = 11 results < PAGE_SIZE 15
    await page.goto('/artists?q=Artist+1&tab=artist')
    await expect(page.getByRole('button', { name: 'Artist 1', exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: /^(Next|Próxima)$/ }).last()).toBeDisabled()
  })

  test('navigate to page 2 via pagination — URL updates and previous becomes enabled', async ({ page }) => {
    await page.goto('/artists?q=Artist&tab=artist&page=1')
    await expect(page.getByRole('button', { name: 'Artist 1', exact: true })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /^(Next|Próxima)$/ }).last().click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByRole('button', { name: /^(Previous|Anterior)$/ }).last()).toBeEnabled({ timeout: 10000 })
  })

  test('navigate back to page 1 — previous becomes disabled again', async ({ page }) => {
    await page.goto('/artists?q=Artist&tab=artist&page=2')
    await expect(page.getByRole('button', { name: 'Artist 16', exact: true })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /^(Previous|Anterior)$/ }).last().click()
    await expect(page).toHaveURL(/page=1/)
    await expect(page.getByRole('button', { name: /^(Previous|Anterior)$/ }).last()).toBeDisabled({ timeout: 10000 })
  })

  test('clicking artist card navigates to artist detail page', async ({ page }) => {
    await page.goto('/artists?q=Artist&tab=artist')
    await expect(page.getByRole('button', { name: 'Artist 1', exact: true })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Artist 1', exact: true }).click()
    await expect(page).toHaveURL(/\/artists\/artist-1/)
  })
})

// ─── Albums ───────────────────────────────────────────────────────────────────

test.describe('Albums search', () => {
  test('album tab shows album cards', async ({ page }) => {
    await page.goto('/artists?q=Album&tab=album')
    await expect(page.getByRole('button', { name: 'Album 1', exact: true })).toBeVisible({ timeout: 15000 })
  })

  test('album card navigates to album detail page', async ({ page }) => {
    await page.goto('/artists?q=Album&tab=album')
    await expect(page.getByRole('button', { name: 'Album 1', exact: true })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Album 1', exact: true }).click()
    await expect(page).toHaveURL(/\/albums\/album-1/)
  })

  test('next button enabled when albums exceed one page (25 total > PAGE_SIZE 15)', async ({ page }) => {
    await page.goto('/artists?q=Album&tab=album&page=1')
    await expect(page.getByRole('button', { name: 'Album 1', exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: /^(Next|Próxima)$/ }).last()).toBeEnabled()
  })

  test('direct navigation to album page 2 loads second batch of results', async ({ page }) => {
    // page 2 offset=15 → Album 16 is first result in mock
    await page.goto('/artists?q=Album&tab=album&page=2')
    await expect(page.getByRole('button', { name: 'Album 16', exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: /^(Previous|Anterior)$/ }).last()).toBeEnabled()
  })
})

// ─── Playlists ────────────────────────────────────────────────────────────────

test.describe('Playlists search', () => {
  test('playlist tab shows playlist cards', async ({ page }) => {
    await page.goto('/artists?q=Playlist&tab=playlist')
    await expect(page.getByRole('button', { name: 'Playlist 1', exact: true })).toBeVisible({ timeout: 15000 })
  })

  test('no results shows empty state message', async ({ page }) => {
    await page.goto('/artists?q=zzznoresults&tab=playlist')
    await expect(page.getByText(/Nenhum resultado|No results/i)).toBeVisible({ timeout: 10000 })
  })
})

// ─── Grid next-page card ──────────────────────────────────────────────────────

test.describe('Grid next-page card', () => {
  test('16th slot next card inside grid navigates to next page', async ({ page }) => {
    await page.goto('/artists?q=Artist&tab=artist&page=1')
    await expect(page.getByRole('button', { name: 'Artist 1', exact: true })).toBeVisible({ timeout: 15000 })
    // first() = card inside the grid; last() = Pagination button at the bottom of the page
    await page.getByRole('button', { name: /^(Next|Próxima)$/ }).first().click()
    await expect(page).toHaveURL(/page=2/)
  })
})

// ─── URL state ────────────────────────────────────────────────────────────────

test.describe('URL state', () => {
  test('direct URL with page=2 loads correct artist page', async ({ page }) => {
    // mock returns 40 artists; page 2 offset=15 → Artist 16 is first card
    await page.goto('/artists?q=Artist&tab=artist&page=2')
    await expect(page.getByRole('button', { name: 'Artist 16', exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: /^(Previous|Anterior)$/ }).last()).toBeEnabled()
  })
})

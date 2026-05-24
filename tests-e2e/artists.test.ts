import { test, expect } from './fixtures/auth'

function pagingOf<T>(items: T[], total?: number) {
  return {
    items,
    limit: 20,
    offset: 0,
    total: total ?? items.length,
    next: null,
    previous: null,
    href: '',
  }
}

test.describe('Artists listing', () => {
  test.beforeEach(async ({ page }) => {
    // Silence album track queries that may be triggered by discography hooks
    await page.route('**/api.spotify.com/v1/albums/*/tracks**', (route) =>
      route.fulfill({ json: pagingOf([]) })
    )
  })

  test('renders artist cards (not a table) with name and image', async ({ page }) => {
    await page.goto('/artists?q=Artist&tab=artist')

    // Should NOT be a table
    expect(await page.locator('table').count()).toBe(0)

    // MediaCard renders role="button" with aria-label={title}; exact: true avoids
    // partial matches like "Artist 1" matching "Artist 10", "Artist 11", etc.
    await expect(
      page.getByRole('button', { name: 'Artist 1', exact: true })
    ).toBeVisible({ timeout: 15000 })
  })

  test('shows pagination controls when there are multiple pages', async ({ page }) => {
    await page.goto('/artists?q=Artist&tab=artist')

    // Mock returns 40 artists, page size 20 — wait for content then check pagination.
    // Pagination "next" button text changes with locale (EN: "Next", PT: "Próxima").
    await expect(
      page.getByRole('button', { name: 'Artist 1', exact: true })
    ).toBeVisible({ timeout: 15000 })

    // Bottom Pagination component renders a next button.
    // With 40 total / 20 per page on page 1, hasNext = true → button enabled.
    const nextBtn = page.getByRole('button', { name: /^(Next|Próxima)$/ }).last()
    await expect(nextBtn).toBeVisible({ timeout: 10000 })
    await expect(nextBtn).toBeEnabled()
  })

  test('next page button navigates to page 2', async ({ page }) => {
    await page.goto('/artists?q=Artist&tab=artist&page=1')

    // Wait for content then click the bottom Pagination next button
    await expect(
      page.getByRole('button', { name: 'Artist 1', exact: true })
    ).toBeVisible({ timeout: 15000 })
    const nextBtn = page.getByRole('button', { name: /^(Next|Próxima)$/ }).last()
    await expect(nextBtn).toBeVisible({ timeout: 10000 })
    await expect(nextBtn).toBeEnabled()
    await nextBtn.click()
    await expect(page).toHaveURL(/page=2/)
  })

  test('filter by artist name shows matching results', async ({ page }) => {
    await page.goto('/artists?q=Artist+1&tab=artist')

    // "Artist 1" is in the filtered results; exact match to avoid partial matches
    await expect(
      page.getByRole('button', { name: 'Artist 1', exact: true })
    ).toBeVisible({ timeout: 15000 })
  })

  test('switching to album tab shows album results', async ({ page }) => {
    await page.goto('/artists?q=Album&tab=album')

    // Mock returns albums named "Album 1" through "Album 5"; exact: true avoids partial matches
    await expect(
      page.getByRole('button', { name: 'Album 1', exact: true }).first()
    ).toBeVisible({ timeout: 15000 })
  })
})

import { test, expect } from './test'
import { NO_RESULTS_QUERY } from './routes'

test.describe('Search', () => {
  test('finds artists and shows the result count', async ({ page }) => {
    await page.goto('/artists')
    await page.getByRole('textbox', { name: 'Search...' }).fill('coldplay')
    await expect(page.getByRole('button', { name: 'Coldplay', exact: true })).toBeVisible()
    await expect(page.getByText('18 results')).toBeVisible()
    await expect(page).toHaveURL(/q=coldplay/)
  })

  test('finds albums', async ({ page }) => {
    await page.goto('/artists')
    await page.getByRole('tab', { name: 'Album' }).click()
    await page.getByRole('textbox', { name: 'Search...' }).fill('parachutes')
    await expect(page.getByRole('button', { name: 'Parachutes' }).first()).toBeVisible()
    await expect(page.getByText('158 results')).toBeVisible()
  })

  test('finds playlists', async ({ page }) => {
    await page.goto('/artists')
    await page.getByRole('tab', { name: 'Playlist' }).click()
    await page.getByRole('textbox', { name: 'Search...' }).fill('workout')
    await expect(page.getByRole('button', { name: 'Metal Workout' })).toBeVisible()
    await expect(page.getByText('169 results')).toBeVisible()
  })

  test('paginates results', async ({ page }) => {
    await page.goto('/artists?q=coldplay&tab=artist')
    await expect(page.getByRole('button', { name: 'Coldplay', exact: true })).toBeVisible()
    const previous = page.getByRole('button', { name: 'Previous' })
    await expect(previous).toBeDisabled()

    const pageTwo = page.waitForRequest(
      (request) => request.url().includes('/search/artist') && /[?&]index=[1-9]/.test(request.url())
    )
    await page.getByRole('button', { name: 'Next' }).last().click()
    await pageTwo
    await expect(page).toHaveURL(/page=2/)
    await expect(previous).toBeEnabled()

    await previous.click()
    await expect(page).toHaveURL(/page=1/)
  })

  test('shows the empty state when nothing matches', async ({ page }) => {
    await page.goto('/artists')
    await page.getByRole('textbox', { name: 'Search...' }).fill(NO_RESULTS_QUERY)
    await expect(page.getByText('No results found')).toBeVisible()
  })

  test('navigates to the artist and album detail pages', async ({ page }) => {
    await page.goto('/artists?q=coldplay&tab=artist')
    await page.getByRole('button', { name: 'Coldplay', exact: true }).click()
    await expect(page).toHaveURL(/\/artists\/892$/)

    await page.goto('/artists?q=parachutes&tab=album')
    await page.getByRole('button', { name: 'Parachutes' }).first().click()
    await expect(page).toHaveURL(/\/albums\/\d+$/)
  })
})

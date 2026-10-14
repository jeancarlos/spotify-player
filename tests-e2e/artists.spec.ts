import { test, expect } from './test'

test.describe('Artists page', () => {
  test('shows Deezer artist charts on an empty search', async ({ page }) => {
    await page.goto('/artists')
    await expect(page.getByText('Top charts on Deezer')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Grupo Menos É Mais' })).toBeVisible()
  })

  test('switches between chart tabs', async ({ page }) => {
    await page.goto('/artists')
    const album = page.getByRole('tab', { name: 'Album' })
    await album.click()
    await expect(album).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('button', { name: 'Balaio (Ao Vivo)' })).toBeVisible()

    const playlist = page.getByRole('tab', { name: 'Playlist' })
    await playlist.click()
    await expect(playlist).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('button', { name: 'Top 50 Sertanejo' })).toBeVisible()
  })

  test('opens an artist from a chart card', async ({ page }) => {
    await page.goto('/artists')
    await page.getByRole('button', { name: 'Grupo Menos É Mais' }).click()
    await expect(page).toHaveURL(/\/artists\/54330242$/)
  })
})

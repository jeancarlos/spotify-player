import { test, expect } from './test'

test('plays a preview, favourites it and keeps it after a reload', async ({ page }) => {
  await page.goto('/artists/892')
  await page.locator('.recharts-bar-rectangle').first().click()

  const pause = page.getByRole('button', { name: 'Pause' })
  await expect(pause).toBeVisible()

  await page.getByRole('button', { name: 'Add to Vinyla List' }).click()
  await expect(page.getByRole('button', { name: 'Remove from Vinyla List' })).toBeVisible()

  const stored = await page.evaluate(() => localStorage.getItem('spoter_favorites_v2'))
  expect(stored).toContain('Yellow')

  await page.goto('/favorites')
  await expect(page.getByText('Yellow').first()).toBeVisible()
  await page.reload()
  await expect(page.getByText('Yellow').first()).toBeVisible()
  await expect(page.getByText('No favorites yet')).toHaveCount(0)
})

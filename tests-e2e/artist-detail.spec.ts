import { test, expect } from './test'

test.describe('Artist detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/artists/892')
  })

  test('shows the artist header and Wikipedia bio', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Coldplay' }).first()).toBeVisible()
    await expect(page.getByText('About the artist')).toBeVisible()
    await expect(page.getByText('Coldplay are a British rock band')).toBeVisible()
  })

  test('shows the ranked top tracks chart', async ({ page }) => {
    await expect(page.getByText('Top tracks on Deezer')).toBeVisible()
    await expect(page.locator('svg.recharts-surface').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Play Yellow' })).toBeAttached()
  })

  test('lists the discography and opens an album', async ({ page }) => {
    await expect(page.getByText('Discography')).toBeVisible()
    await page.getByRole('button', { name: /Moon Music/ }).first().click()
    await expect(page).toHaveURL(/\/albums\/\d+$/)
  })
})

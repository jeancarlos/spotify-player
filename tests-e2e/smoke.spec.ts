import { test, expect } from './test'

test('loads without login and sets the title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Vinyla/)
  await expect(page.getByRole('textbox', { name: 'Search...' })).toBeVisible()
  await expect(page.getByRole('link', { name: /deezer/i }).first()).toHaveAttribute(
    'href',
    /deezer\.com/
  )
})

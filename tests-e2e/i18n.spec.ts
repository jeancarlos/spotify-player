import { test, expect } from './test'

test('language switch applies and persists across routes', async ({ page }) => {
  await page.goto('/artists')
  const pt = page.getByRole('button', { name: 'PT', exact: true })
  const en = page.getByRole('button', { name: 'EN', exact: true })

  await expect(en).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('tab', { name: 'Artist' })).toBeVisible()

  await pt.click()
  await expect(pt).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('tab', { name: 'Artista' })).toBeVisible()
  await expect(page.getByText('Em alta no Deezer')).toBeVisible()

  await page.goto('/favorites')
  await expect(pt).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Nenhum favorito ainda')).toBeVisible()

  await en.click()
  await expect(page.getByText('No favorites yet')).toBeVisible()
  await page.goto('/artists')
  await expect(en).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Top charts on Deezer')).toBeVisible()
})

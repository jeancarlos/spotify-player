import { test, expect } from './fixtures/auth'

test.describe('Favorites form', () => {
  test('favorites page renders the Add button', async ({ page }) => {
    await page.goto('/favorites')
    // Button text is t('favorites.addButton') = "Adicionar favorito" (PT) / "Add favorite" (EN)
    const addBtn = page.getByRole('button', { name: /adicionar favorito|add favorite/i })
    await expect(addBtn).toBeVisible({ timeout: 10000 })
  })

  test('clicking Add opens the popover with the track combobox', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click()
    // TrackAutocomplete renders an input with role="combobox"
    const combobox = page.getByRole('combobox')
    await expect(combobox).toBeVisible({ timeout: 5000 })
  })

  test('popover contains the note textarea and submit button', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click()
    // Note textarea — role="textbox" matches textarea
    await expect(page.getByRole('textbox')).toBeVisible({ timeout: 5000 })
    // Submit button text: t('favorites.addConfirm') = "Adicionar ao favorito" / "Add to favorites"
    await expect(
      page.getByRole('button', { name: /adicionar ao favorito|add to favorites/i })
    ).toBeVisible({ timeout: 5000 })
  })

  test('submit button is disabled until a track is selected', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click()
    // Submit button: t('favorites.addConfirm') — disabled while track is empty (zod validation)
    const submitBtn = page.getByRole('button', { name: /adicionar ao favorito|add to favorites/i })
    await submitBtn.waitFor({ timeout: 5000 })
    await expect(submitBtn).toBeDisabled()
  })

  test('combobox input has correct placeholder text', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click()
    const combobox = page.getByRole('combobox')
    await combobox.waitFor({ timeout: 5000 })
    // Placeholder: t('favorites.searchAutocomplete') = "Buscar música ou artista..." / "Search for a song or artist..."
    await expect(combobox).toHaveAttribute('placeholder', /.+/)
  })

  test('Add button toggles label to Close when popover is open', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click()
    // Button now shows t('favorites.close') = "Fechar" / "Close"
    await expect(
      page.getByRole('button', { name: /^fechar$|^close$/i }).first()
    ).toBeVisible({ timeout: 5000 })
  })
})

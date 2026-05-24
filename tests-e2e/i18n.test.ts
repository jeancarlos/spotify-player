import { test, expect } from './fixtures/auth'
import { test as unauthTest, expect as unauthExpect } from '@playwright/test'

test.describe('i18n language switcher — authenticated pages', () => {
  test('PT and EN buttons are visible on favorites page', async ({ page }) => {
    await page.goto('/favorites')
    // LanguageSwitcher is rendered fixed top-right in AppShell for all authenticated routes
    await expect(page.getByRole('button', { name: 'PT', exact: true })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible({
      timeout: 10000,
    })
  })

  test('switching to EN changes the Add button label', async ({ page }) => {
    await page.goto('/favorites')
    // Ensure PT is active first
    await page.getByRole('button', { name: 'PT', exact: true }).click()
    // PT label: "Adicionar favorito"
    await expect(
      page.getByRole('button', { name: /adicionar favorito/i })
    ).toBeVisible({ timeout: 5000 })

    // Switch to EN
    await page.getByRole('button', { name: 'EN', exact: true }).click()
    // EN label: "Add favorite"
    await expect(
      page.getByRole('button', { name: /add favorite/i })
    ).toBeVisible({ timeout: 3000 })
  })

  test('switching back to PT restores Portuguese labels', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await expect(
      page.getByRole('button', { name: /add favorite/i })
    ).toBeVisible({ timeout: 3000 })

    await page.getByRole('button', { name: 'PT', exact: true }).click()
    await expect(
      page.getByRole('button', { name: /adicionar favorito/i })
    ).toBeVisible({ timeout: 3000 })
  })

  test('EN button has aria-pressed=true when EN is active', async ({ page }) => {
    await page.goto('/favorites')
    const enBtn = page.getByRole('button', { name: 'EN', exact: true })
    await enBtn.waitFor({ timeout: 10000 })
    await enBtn.click()
    // LanguageSwitcher sets aria-pressed={state.language === code}
    await expect(enBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('PT button has aria-pressed=true when PT is active', async ({ page }) => {
    await page.goto('/favorites')
    const ptBtn = page.getByRole('button', { name: 'PT', exact: true })
    await ptBtn.waitFor({ timeout: 10000 })
    await ptBtn.click()
    await expect(ptBtn).toHaveAttribute('aria-pressed', 'true')
  })
})

unauthTest.describe('i18n language switcher — login page', () => {
  unauthTest('PT/EN toggle changes login button label', async ({ page }) => {
    await page.goto('/login')
    const enBtn = page.getByRole('button', { name: 'EN', exact: true }).first()
    const ptBtn = page.getByRole('button', { name: 'PT', exact: true }).first()

    await unauthExpect(enBtn).toBeVisible({ timeout: 5000 })
    await unauthExpect(ptBtn).toBeVisible({ timeout: 5000 })

    // Switch to EN — login button changes to "Sign in with Spotify"
    await enBtn.click()
    await unauthExpect(
      page.getByRole('button', { name: /sign in with spotify/i })
    ).toBeVisible({ timeout: 3000 })

    // Switch back to PT — login button changes to "Entrar com Spotify"
    await ptBtn.click()
    await unauthExpect(
      page.getByRole('button', { name: /entrar com spotify/i })
    ).toBeVisible({ timeout: 3000 })
  })

  unauthTest('EN button gets aria-pressed=true after click', async ({ page }) => {
    await page.goto('/login')
    const enBtn = page.getByRole('button', { name: 'EN', exact: true }).first()
    await enBtn.click()
    await unauthExpect(enBtn).toHaveAttribute('aria-pressed', 'true')
  })
})

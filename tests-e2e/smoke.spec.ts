import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Spoter/);
});

test('shows login button', async ({ page }) => {
  await page.goto('/login');
  const loginButton = page.getByRole('button', { name: /Entrar com Spotify|Sign in with Spotify/i });
  await expect(loginButton).toBeVisible();
});

test('can switch language', async ({ page }) => {
  await page.goto('/login');

  // Usamos getByRole para ser mais resiliente que IDs dinâmicos
  const langEN = page.getByRole('button', { name: 'EN' });
  const langPT = page.getByRole('button', { name: 'PT' });

  await langEN.click();
  await expect(page.getByText(/Sign in with Spotify/i)).toBeVisible();

  await langPT.click();
  await expect(page.getByText(/Entrar com Spotify/i)).toBeVisible();
});

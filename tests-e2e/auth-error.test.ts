import { test, expect } from '@playwright/test';

test.describe('Auth Error Page', () => {
  test('should show state mismatch error', async ({ page }) => {
    await page.goto('/auth-error?reason=state_mismatch');

    await expect(page.getByText(/Authentication failed/i)).toBeVisible();

    await expect(page.getByText(/Session security data expired or was lost/i)).toBeVisible();

    await expect(page.getByText(/This can happen if the window took too long/i)).toBeVisible();
  });

  test('should show token error', async ({ page }) => {
    await page.goto('/auth-error?reason=token_error');

    await expect(page.getByText(/Could not complete the authorization exchange/i)).toBeVisible();
  });

  test('should show unknown error for invalid reasons', async ({ page }) => {
    await page.goto('/auth-error?reason=something_else');

    await expect(page.getByText(/An unexpected error occurred during authentication/i)).toBeVisible();
  });

  test('retry button should navigate to login', async ({ page }) => {
    await page.goto('/auth-error?reason=token_error');

    const retryButton = page.getByRole('button', { name: /Try again/i });
    await retryButton.click();

    await expect(page).toHaveURL(/\/login/);
  });
});

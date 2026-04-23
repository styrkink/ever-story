/**
 * Google OAuth tests — TC-REG-021 to TC-REG-024
 *
 * TC-REG-021 and TC-REG-023 require a real Google account and OAuth popup,
 * which cannot be automated headlessly without Google test credentials.
 * Those tests are skipped with an explanation.
 *
 * TC-REG-022 (popup cancel) and TC-REG-024 (server-side token validation)
 * are automated via mocking/API interception.
 */

import { test, expect } from '@playwright/test';
import { uniqueEmail, API_URL } from '../helpers/api';

test.describe('Google OAuth', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  // ─── TC-REG-021 (BLOCKER) ─────────────────────────────────────────────
  test.skip('[TC-REG-021] Successful registration via Google OAuth @smoke', async ({
    page,
  }) => {
    /**
     * SKIPPED — Requires real Google OAuth credentials and popup interaction.
     * Automate using a dedicated Google test account via Playwright auth storage,
     * or use a library such as `playwright-google-auth` in a staging environment
     * with OAuth consent screen in test mode.
     *
     * Manual validation steps:
     * 1. Click "Регистрация через Google"
     * 2. Complete Google auth in popup
     * 3. Assert redirect to onboarding
     */
  });

  // ─── TC-REG-022 ──────────────────────────────────────────────────────────
  test('[TC-REG-022] Google OAuth popup cancel does not break registration page', async ({
    page,
  }) => {
    // Intercept the click and immediately close any popup that would open
    page.on('popup', async (popup) => {
      await popup.close();
    });

    await page.getByRole('button', { name: /Google/i }).click();

    // Wait briefly for any side effects
    await page.waitForTimeout(500);

    // Page must still be fully functional after popup is closed
    await expect(page).toHaveURL('/register');
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Пароль')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Зарегистрироваться' }),
    ).toBeEnabled();
  });

  // ─── TC-REG-023 ──────────────────────────────────────────────────────────
  test.skip('[TC-REG-023] Existing Google account logs in without creating duplicate', async ({
    page,
  }) => {
    /**
     * SKIPPED — Requires a pre-linked Google account in the staging database.
     *
     * Manual validation steps:
     * 1. Ensure account with existing@gmail.com is in DB
     * 2. Click "Регистрация через Google" and authenticate with that account
     * 3. Assert either login redirect or clear "account already exists" message
     * 4. Verify no duplicate row in users table
     */
  });

  // ─── TC-REG-024 ──────────────────────────────────────────────────────────
  test('[TC-REG-024] Google OAuth callback rejects tampered token', async ({
    request,
  }) => {
    test.fixme(true, 'POST /api/auth/google/callback endpoint not yet implemented');
    /**
     * Simulates an attacker sending a modified OAuth callback token.
     * The server must reject it with 400/401/403 — not create an account.
     *
     * NOTE: Will FAIL until the Google OAuth callback endpoint is implemented.
     * Expected endpoint: POST /api/auth/google/callback
     */
    const res = await request.post(`${API_URL}/api/auth/google/callback`, {
      data: {
        code: 'TAMPERED_OAUTH_CODE_123',
        state: 'invalid-state-value',
      },
    });

    expect([400, 401, 403]).toContain(res.status());

    // No account should be created
    const body = await res.json().catch(() => ({}));
    expect(body).not.toHaveProperty('accessToken');
  });
});

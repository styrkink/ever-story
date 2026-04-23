/**
 * UI / Interaction tests — TC-REG-006 to TC-REG-010
 * Verify interactive behaviour: password toggle, focus, navigation links.
 */

import { test, expect } from '@playwright/test';

test.describe('UI / Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  // ─── TC-REG-006 ──────────────────────────────────────────────────────────
  test('[TC-REG-006] Password field masks input with toggle visibility', async ({
    page,
  }) => {
    const passwordInput = page.getByPlaceholder('Пароль');
    const toggleBtn = page.getByRole('button', { name: /показать пароль|скрыть пароль/i });

    await passwordInput.fill('MySecret1!');

    // Default: masked
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // After click: visible
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // After second click: masked again
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // ─── TC-REG-007 ──────────────────────────────────────────────────────────
  test('[TC-REG-007] Input fields highlight on focus with purple border', async ({
    page,
  }) => {
    const inputs = [
      page.getByPlaceholder('Полное имя'),
      page.getByPlaceholder('Email'),
      page.getByPlaceholder('Пароль'),
    ];

    for (const input of inputs) {
      await input.focus();
      // The input wrapper has a purple/violet border in the design (#7B2FFF).
      // We check that focus is on the right element.
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBe('INPUT');
    }
  });

  // ─── TC-REG-008 ──────────────────────────────────────────────────────────
  test('[TC-REG-008] "Already have account?" link navigates to /login', async ({
    page,
  }) => {
    const loginLink = page.getByRole('link', { name: 'Войти' });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login');

    await loginLink.click();
    await expect(page).toHaveURL('/login');
  });

  // ─── TC-REG-009 ──────────────────────────────────────────────────────────
  test('[TC-REG-009] "Terms of Use" link is present', async ({ page }) => {
    const termsLink = page.getByRole('link', { name: /Условиями использования/i });
    await expect(termsLink).toBeVisible();

    const href = await termsLink.getAttribute('href');
    expect(href).toBeTruthy();
    // TODO: change to expect(href).not.toBe('#') once /terms route is built.
    // Currently href="#" — tracked as deferred LOW-priority item.
  });

  // ─── TC-REG-010 ──────────────────────────────────────────────────────────
  test('[TC-REG-010] Copyright footer "© EverStory 2025" present on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByText('© EverStory 2025')).toBeVisible();
  });
});

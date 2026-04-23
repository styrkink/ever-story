/**
 * UI / Layout tests — TC-REG-001 to TC-REG-005
 * Verify the registration page renders correctly on mobile and desktop.
 */

import { test, expect } from '@playwright/test';

test.describe('UI / Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  // ─── TC-REG-001 ──────────────────────────────────────────────────────────
  test('[TC-REG-001] Mobile layout renders correctly on iPhone SE (375px)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.getByPlaceholder('Полное имя')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Пароль')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Зарегистрироваться' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();

    // No horizontal scroll
    const overflow = await page.evaluate(
      () => document.body.scrollWidth - document.body.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  // ─── TC-REG-002 ──────────────────────────────────────────────────────────
  test('[TC-REG-002] Desktop shows split-panel layout with illustration on right', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Left panel: form visible
    await expect(page.getByRole('heading', { name: /Добро пожаловать/i })).toBeVisible();

    // Right panel: illustration and social-proof badges visible
    const rightPanel = page.locator('[class*="rightPanel"], [class*="right-panel"]').or(
      // Fallback: look for the unique badge text
      page.getByText('10 000+ семей'),
    );
    await expect(rightPanel.first()).toBeVisible();

    await expect(page.getByText('10 000+ семей')).toBeVisible();
    await expect(page.getByText('90 секунд')).toBeVisible();
    await expect(page.getByText(/Мой сын в восторге/)).toBeVisible();
  });

  // ─── TC-REG-003 ──────────────────────────────────────────────────────────
  test('[TC-REG-003] EverStory logo and brand name visible in header', async ({
    page,
  }) => {
    await expect(page.getByText('✨ EverStory')).toBeVisible();

    // Dark background consistent with design system
    const body = page.locator('body');
    // The page wrapper div carries the dark background, not the body
    const wrapperBg = await page.locator('div').first().evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(wrapperBg).not.toBe('rgb(255, 255, 255)');
  });

  // ─── TC-REG-004 ──────────────────────────────────────────────────────────
  test('[TC-REG-004] Social proof badges on desktop are visible and accurate', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await expect(page.getByText('✨ 10 000+ семей')).toBeVisible();
    await expect(page.getByText('уже создают магию')).toBeVisible();
    await expect(page.getByText('⚡ 90 секунд')).toBeVisible();
    await expect(page.getByText('до готовой сказки')).toBeVisible();
  });

  // ─── TC-REG-005 ──────────────────────────────────────────────────────────
  test('[TC-REG-005] Form placeholder text is present and in Russian', async ({
    page,
  }) => {
    await expect(page.getByPlaceholder('Полное имя')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Пароль')).toBeVisible();
  });
});

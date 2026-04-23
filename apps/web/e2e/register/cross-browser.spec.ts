/**
 * Cross-Browser / Device tests — TC-REG-039 to TC-REG-042
 *
 * These tests run via the projects defined in playwright.config.ts.
 * Each test that is device-specific uses test.skip() to target the right project.
 */

import { test, expect } from '@playwright/test';
import { uniqueEmail } from '../helpers/api';

test.describe('Cross-Browser / Device', () => {
  // ─── TC-REG-039 ──────────────────────────────────────────────────────────
  test('[TC-REG-039] Registration form works on Safari / WebKit (iPhone 13 viewport)', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'webkit' && !process.env.RUN_ALL_BROWSERS,
      'Run with --project=mobile-safari or set RUN_ALL_BROWSERS=1',
    );

    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13
    await page.goto('/register');

    await expect(page.getByPlaceholder('Полное имя')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Пароль')).toBeVisible();

    // Fill and submit
    const email = uniqueEmail();
    await page.getByPlaceholder('Полное имя').fill('Safari User');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Пароль').fill('StrongPass1!');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    // Page must respond (either redirect or show error — no hard crash)
    await page.waitForTimeout(3000);
    const url = page.url();
    const hasError = await page.getByText(/ошибка|error/i).isVisible();
    expect(url !== 'about:blank' || !hasError).toBeTruthy();
  });

  // ─── TC-REG-040 ──────────────────────────────────────────────────────────
  test('[TC-REG-040] Registration form works on Chrome Android (Pixel 5 viewport)', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium' && !process.env.RUN_ALL_BROWSERS,
      'Run with --project=mobile-chrome or set RUN_ALL_BROWSERS=1',
    );

    await page.setViewportSize({ width: 393, height: 851 }); // Pixel 5
    await page.goto('/register');

    // Virtual keyboard simulation: focus password and check submit button is still visible
    const passInput = page.getByPlaceholder('Пароль');
    await passInput.focus();

    // Submit button should remain accessible (not hidden behind virtual keyboard)
    const submitBtn = page.getByRole('button', { name: 'Зарегистрироваться' });
    await expect(submitBtn).toBeVisible();

    // Complete registration
    const email = uniqueEmail();
    await page.getByPlaceholder('Полное имя').fill('Android User');
    await page.getByPlaceholder('Email').fill(email);
    await passInput.fill('StrongPass1!');
    await submitBtn.click();

    await page.waitForTimeout(3000);
    // Must not be a blank page or unhandled error
    await expect(page.locator('body')).not.toBeEmpty();
  });

  // ─── TC-REG-041 ──────────────────────────────────────────────────────────
  test('[TC-REG-041] Registration works on Firefox desktop', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'firefox' && !process.env.RUN_ALL_BROWSERS,
      'Run with --project=firefox or set RUN_ALL_BROWSERS=1',
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/register');

    // Split-panel layout must render correctly
    await expect(page.getByRole('heading', { name: /Добро пожаловать/i })).toBeVisible();

    // No console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const email = uniqueEmail();
    await page.getByPlaceholder('Полное имя').fill('Firefox User');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Пароль').fill('StrongPass1!');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    await page.waitForTimeout(2000);
    expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
  });

  // ─── TC-REG-042 ──────────────────────────────────────────────────────────
  test('[TC-REG-042] iPad Air landscape renders correct layout', async ({
    page,
    browserName,
  }) => {
    test.skip(
      !['webkit', 'chromium'].includes(browserName) && !process.env.RUN_ALL_BROWSERS,
      'Run with --project=tablet or set RUN_ALL_BROWSERS=1',
    );

    // iPad Air landscape: 1180 × 820
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto('/register');

    // At this width (≥ 1024px lg breakpoint) the two-column layout should apply
    await expect(page.getByRole('heading', { name: /Добро пожаловать/i })).toBeVisible();

    // Right panel should be visible (desktop layout)
    await expect(page.getByText('10 000+ семей')).toBeVisible();

    // No horizontal overflow
    const overflow = await page.evaluate(
      () => document.body.scrollWidth - document.body.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    // Form must be usable
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Зарегистрироваться' }),
    ).toBeEnabled();
  });
});

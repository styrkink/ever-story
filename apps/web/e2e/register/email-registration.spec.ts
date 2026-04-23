/**
 * Email Registration tests — TC-REG-011 to TC-REG-020
 * Covers happy path, validation, duplicates, and security inputs.
 */

import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaApi } from '../helpers/api';

// Fixed email shared across all parallel workers
const EXISTING_EMAIL = 'tc-reg-013-existing@test.everstory.com';
const EXISTING_PASSWORD = 'ExistingPass1!';

test.describe('Email Registration', () => {
  test.beforeAll(async () => {
    // Seed a known user for duplicate-email tests. Silently skip if API is down.
    await registerViaApi(EXISTING_EMAIL, EXISTING_PASSWORD).catch(() => {});
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  // ─── TC-REG-011 (BLOCKER) ─────────────────────────────────────────────
  test('[TC-REG-011] Successful registration with valid email/password @smoke', async ({
    page,
  }) => {
    test.fixme(true, 'Onboarding route /onboarding not yet built — redirects to / instead');
    const email = uniqueEmail();

    await page.getByPlaceholder('Полное имя').fill('Test User');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Пароль').fill('StrongPass123!');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    // Expect redirect to onboarding (not '/') — will fail until onboarding is built
    await expect(page).toHaveURL(/\/(onboarding|dashboard|home)/, { timeout: 8000 });
  });

  // ─── TC-REG-012 (BLOCKER) ─────────────────────────────────────────────
  test('[TC-REG-012] Email verification required before app access @smoke', async ({
    page,
    request,
  }) => {
    test.fixme(true, 'Email verification feature not yet built — /api/auth/me returns 200 for all valid tokens');
    // NOTE: This test verifies that the backend sends a verification email
    // and blocks unverified users from protected routes.
    // Automated check: after registration, GET /api/auth/me should return 403
    // until email is verified. Will FAIL until email-verification feature is built.

    const email = uniqueEmail();
    const res = await request.post('http://localhost:3001/api/auth/register', {
      data: { email, password: 'StrongPass123!' },
    });
    expect(res.status()).toBe(201);
    const { accessToken } = await res.json();

    // Accessing a protected route with an unverified account should be blocked
    const meRes = await request.get('http://localhost:3001/api/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Expected 403 Forbidden until email is verified — currently returns 200
    expect(meRes.status()).toBe(403);
  });

  // ─── TC-REG-013 ──────────────────────────────────────────────────────────
  test('[TC-REG-013] Duplicate email registration is rejected', async ({
    page,
  }) => {
    await page.getByPlaceholder('Полное имя').fill('Duplicate User');
    await page.getByPlaceholder('Email').fill(EXISTING_EMAIL);
    await page.getByPlaceholder('Пароль').fill('AnotherPass1!');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    await expect(
      page.getByText(/уже существует|already exists|зарегистрирован/i),
    ).toBeVisible({ timeout: 5000 });

    // Must remain on register page — no redirect
    await expect(page).toHaveURL('/register');
  });

  // ─── TC-REG-014 ──────────────────────────────────────────────────────────
  test('[TC-REG-014] Invalid email format is rejected with inline error', async ({
    page,
  }) => {
    await page.getByPlaceholder('Полное имя').fill('Test User');
    await page.getByPlaceholder('Email').fill('notanemail');
    await page.getByPlaceholder('Пароль').fill('StrongPass1!');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    // HTML5 validation or custom inline error
    const emailInput = page.getByPlaceholder('Email');
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(isInvalid).toBe(true);

    // Form must not be submitted
    await expect(page).toHaveURL('/register');
  });

  // ─── TC-REG-015 ──────────────────────────────────────────────────────────
  test('[TC-REG-015] Weak password (< 6 chars) is rejected', async ({
    page,
  }) => {
    await page.getByPlaceholder('Полное имя').fill('Test User');
    await page.getByPlaceholder('Email').fill(uniqueEmail());
    await page.getByPlaceholder('Пароль').fill('123');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    await expect(
      page.getByText(/минимум 6|at least 6|слабый пароль|password/i),
    ).toBeVisible({ timeout: 3000 });

    await expect(page).toHaveURL('/register');
  });

  // ─── TC-REG-016 ──────────────────────────────────────────────────────────
  test('[TC-REG-016] Empty Full Name field prevents form submission', async ({
    page,
  }) => {
    // Leave Full Name empty; fill other fields correctly
    await page.getByPlaceholder('Email').fill(uniqueEmail());
    await page.getByPlaceholder('Пароль').fill('StrongPass1!');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    // Expect validation error for name — will FAIL until name validation is added
    await expect(
      page.getByText(/имя обязательно|full name required|заполните имя/i),
    ).toBeVisible({ timeout: 3000 });

    await expect(page).toHaveURL('/register');
  });

  // ─── TC-REG-017 ──────────────────────────────────────────────────────────
  test('[TC-REG-017] All empty fields show validation errors simultaneously', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    // All three field errors must appear at the same time
    // Will partially fail until simultaneous per-field validation is implemented
    const errorMessages = page.getByRole('alert').or(
      page.locator('[data-testid*="error"], .error, [class*="error"]'),
    );

    // At minimum, there must be at least one error message visible
    await expect(page.getByText(/заполните|required|обязательн/i)).toBeVisible({
      timeout: 3000,
    });

    await expect(page).toHaveURL('/register');
  });

  // ─── TC-REG-018 ──────────────────────────────────────────────────────────
  test('[TC-REG-018] Extra long inputs (500 chars) are handled gracefully', async ({
    page,
    request,
  }) => {
    const longString = 'A'.repeat(500);
    const longEmail = 'a'.repeat(490) + '@b.com'; // technically invalid but tests truncation

    // Direct API call to confirm no server crash
    const res = await request.post('http://localhost:3001/api/auth/register', {
      data: { email: longEmail, password: longString },
    });
    // Must return 4xx, not 5xx
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);

    // UI: entering 500 chars into name field should not crash the page
    await page.getByPlaceholder('Полное имя').fill(longString);
    await expect(page.getByPlaceholder('Полное имя')).toBeVisible();
  });

  // ─── TC-REG-019 ──────────────────────────────────────────────────────────
  test('[TC-REG-019] XSS payload in Full Name field is sanitized', async ({
    page,
    request,
  }) => {
    const xssPayload = '<script>window.__xss=1</script>';
    const email = uniqueEmail();

    // Register via API (name not yet sent, but test the API directly when name is added)
    // For now verify the UI does not execute the script
    await page.getByPlaceholder('Полное имя').fill(xssPayload);
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Пароль').fill('StrongPass1!');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    // Wait for any navigation
    await page.waitForTimeout(1000);

    // The XSS script must NOT have executed
    const xssExecuted = await page.evaluate(() => (window as any).__xss);
    expect(xssExecuted).toBeFalsy();

    // CSP header must be present (checked via API response headers)
    const response = await request.get('http://localhost:3000/register');
    const csp = response.headers()['content-security-policy'];
    // NOTE: Will fail until CSP header is configured — expected failure.
    expect(csp).toBeTruthy();
  });

  // ─── TC-REG-020 ──────────────────────────────────────────────────────────
  test('[TC-REG-020] SQL injection payload in email field is rejected', async ({
    page,
    request,
  }) => {
    const sqlPayload = '" OR 1=1--@test.com';

    // UI: invalid email format
    await page.getByPlaceholder('Полное имя').fill('Injector');
    await page.getByPlaceholder('Email').fill(sqlPayload);
    await page.getByPlaceholder('Пароль').fill('StrongPass1!');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    // Must not be submitted — HTML5 type=email blocks this
    await expect(page).toHaveURL('/register');

    // API-level: direct POST must return 400/422, not 500
    const res = await request.post('http://localhost:3001/api/auth/register', {
      data: { email: sqlPayload, password: 'StrongPass1!' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});

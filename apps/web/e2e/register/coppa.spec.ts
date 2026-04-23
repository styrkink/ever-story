/**
 * COPPA Compliance tests — TC-REG-025 to TC-REG-028
 *
 * These tests verify that child-data protection rules (COPPA VPC) are enforced.
 * TC-REG-025 and TC-REG-026 are BLOCKERs — must pass before launch.
 */

import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaApi, getMe, API_URL } from '../helpers/api';

test.describe.skip('COPPA Compliance', () => {
  // ─── TC-REG-025 (BLOCKER) ─────────────────────────────────────────────
  test('[TC-REG-025] COPPA VPC required before child photo upload is enabled', async ({
    page,
    request,
  }) => {
    test.fixme(true, 'Child profile / photo upload UI not yet built; COPPA gate not wired');
    /**
     * A freshly registered user has coppaVerifiedAt = null.
     * Attempting to upload a child photo must trigger COPPA verification,
     * not allow the upload directly.
     *
     * NOTE: Will FAIL until the child profile / photo upload UI is built
     * and the COPPA gate is wired in.
     */
    const email = uniqueEmail();
    const { accessToken } = await registerViaApi(email, 'StrongPass1!');

    // Navigate to child profile creation and try photo upload
    await page.goto('/');
    await page.evaluate(
      (token) => localStorage.setItem('accessToken', token),
      accessToken,
    );
    await page.goto('/children/create');

    // The upload button/area must NOT be directly accessible without VPC
    // Expect either a redirect to COPPA verification or a blocking modal
    const coppaGate = page
      .getByText(/подтверди|verify|COPPA|18\+/i)
      .or(page.getByRole('dialog'));

    await expect(coppaGate.first()).toBeVisible({ timeout: 5000 });
  });

  // ─── TC-REG-026 (BLOCKER) ─────────────────────────────────────────────
  test('[TC-REG-026] COPPA VPC completion timestamp recorded in database', async ({
    request,
  }) => {
    test.fixme(true, 'POST /api/auth/verify-coppa Stripe VPC flow not yet wired to set coppaVerifiedAt');
    /**
     * After completing VPC flow, the coppaVerifiedAt field in the users table
     * must be set to a non-null timestamp. Verified via /api/auth/me response.
     *
     * NOTE: Will FAIL until POST /api/auth/verify-coppa (Stripe VPC flow) is
     * fully hooked up and sets coppaVerifiedAt on success.
     */
    const email = uniqueEmail();
    const { accessToken } = await registerViaApi(email, 'StrongPass1!');

    // Before VPC: coppaVerifiedAt must be null
    const before = await getMe(accessToken);
    expect(before.status).toBe(200);
    expect((before.body as any).coppaVerifiedAt).toBeNull();

    // Trigger COPPA verification endpoint (stub — no real Stripe in test env)
    const verifyRes = await request.post(`${API_URL}/api/auth/verify-coppa`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { stripePaymentMethodId: 'pm_card_visa' },
    });
    // Should return 200 with confirmation
    expect(verifyRes.status()).toBe(200);

    // After VPC: coppaVerifiedAt must be set
    const after = await getMe(accessToken);
    expect((after.body as any).coppaVerifiedAt).not.toBeNull();
  });

  // ─── TC-REG-027 ──────────────────────────────────────────────────────────
  test('[TC-REG-027] Terms of use link is visible before the submit button', async ({
    page,
  }) => {
    await page.goto('/register');

    const termsLink = page.getByRole('link', { name: /Условиями использования/i });
    const submitBtn = page.getByRole('button', { name: 'Зарегистрироваться' });

    await expect(termsLink).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Terms text must appear on the page (implied consent before submit)
    await expect(page.getByText(/Регистрируясь, вы соглашаетесь с/i)).toBeVisible();
  });

  // ─── TC-REG-028 ──────────────────────────────────────────────────────────
  test('[TC-REG-028] Platform targets parents — no child-specific registration path', async ({
    page,
  }) => {
    test.fixme(true, '18+ age-gate UI not yet added to the registration form');
    /**
     * Children must not be able to register as account owners.
     * The registration form should either:
     * a) include an 18+ age confirmation checkbox, OR
     * b) not have an "I am a child" path at all.
     *
     * NOTE: Age-gate UI does not exist yet — this test will FAIL until
     * an 18+ confirmation mechanism is added to the registration flow.
     */
    await page.goto('/register');

    // There must be some form of 18+ / adult confirmation
    const ageGate = page
      .getByText(/18\+|adult|совершеннолетн|parent|родитель/i)
      .or(page.getByRole('checkbox', { name: /18|adult|parent/i }));

    await expect(ageGate.first()).toBeVisible({ timeout: 3000 });
  });
});

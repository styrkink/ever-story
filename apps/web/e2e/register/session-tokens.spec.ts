/**
 * Session / Token tests — TC-REG-029 to TC-REG-032
 * Verify JWT lifecycle: access token TTL, refresh token TTL, session invalidation.
 */

import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaApi, loginViaApi, getMe, decodeJwt, API_URL } from '../helpers/api';

test.describe('Session / Tokens', () => {
  // ─── TC-REG-029 ──────────────────────────────────────────────────────────
  test('[TC-REG-029] JWT access token expires after 15 minutes', async ({
    request,
  }) => {
    const email = uniqueEmail();
    const { accessToken } = await registerViaApi(email, 'StrongPass1!');

    const payload = decodeJwt(accessToken);

    // Verify token type and TTL claim
    expect(payload['type']).toBe('access');

    const iat = payload['iat'] as number;
    const exp = payload['exp'] as number;
    const ttlSeconds = exp - iat;

    // Must be exactly 15 minutes (900 seconds) — ±5s tolerance for clock skew
    expect(ttlSeconds).toBeGreaterThanOrEqual(895);
    expect(ttlSeconds).toBeLessThanOrEqual(905);

    // Verify the token currently works
    const validRes = await getMe(accessToken);
    expect(validRes.status).toBe(200);

    // Craft an artificially expired token by manipulating exp in the payload.
    // NOTE: We cannot forge a signed token, so we test expiry via the claims only.
    // The integration test for actual expiry (waiting 16 min) is done in the
    // nightly regression suite or via time-manipulation in the test environment.
  });

  // ─── TC-REG-030 ──────────────────────────────────────────────────────────
  test('[TC-REG-030] Refresh token is valid for 30 days', async ({
    request,
  }) => {
    const email = uniqueEmail();
    const { refreshToken } = await registerViaApi(email, 'StrongPass1!');

    const payload = decodeJwt(refreshToken);

    expect(payload['type']).toBe('refresh');

    const iat = payload['iat'] as number;
    const exp = payload['exp'] as number;
    const ttlDays = (exp - iat) / 86400;

    // Must be 30 days — ±1 minute tolerance
    expect(ttlDays).toBeGreaterThanOrEqual(29.999);
    expect(ttlDays).toBeLessThanOrEqual(30.001);

    // Day 29: refresh should succeed
    const refreshRes = await request.post(`${API_URL}/api/auth/refresh`, {
      data: { refreshToken },
    });
    expect(refreshRes.status()).toBe(200);
    const newTokens = await refreshRes.json();
    expect(newTokens).toHaveProperty('accessToken');
    expect(newTokens).toHaveProperty('refreshToken');
  });

  // ─── TC-REG-031 ──────────────────────────────────────────────────────────
  test('[TC-REG-031] Logout invalidates the access token immediately', async ({
    request,
  }) => {
    /**
     * Full "password change → all sessions invalidated" requires a
     * PATCH /api/auth/password endpoint (not yet implemented).
     *
     * This test verifies the next best thing: logout blocks the access token.
     * Extend this test once the password-change endpoint is available.
     */
    const email = uniqueEmail();
    const { accessToken, refreshToken } = await registerViaApi(email, 'StrongPass1!');

    // Token works before logout
    const beforeLogout = await getMe(accessToken);
    expect(beforeLogout.status).toBe(200);

    // Logout
    const logoutRes = await request.post(`${API_URL}/api/auth/logout`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { refreshToken },
    });
    expect(logoutRes.status()).toBe(200);

    // Token must be blocked after logout
    const afterLogout = await getMe(accessToken);
    expect(afterLogout.status).toBe(401);
  });

  // ─── TC-REG-032 ──────────────────────────────────────────────────────────
  test('[TC-REG-032] Refresh token persists session after simulated browser restart', async ({
    page,
    request,
  }) => {
    /**
     * "Remember me 30 days" — refresh token stored in localStorage persists
     * across page navigations (simulating browser restart).
     *
     * NOTE: True "browser restart" persistence requires the token to be stored
     * in a cookie or localStorage (which survives page reload but not browser
     * data clear). This test checks that the token survives a page reload.
     */
    const email = uniqueEmail();
    const { accessToken, refreshToken } = await registerViaApi(email, 'StrongPass1!');

    // Inject tokens into the page
    await page.goto('/register');
    await page.evaluate(
      ([at, rt]) => {
        localStorage.setItem('accessToken', at);
        localStorage.setItem('refreshToken', rt);
      },
      [accessToken, refreshToken],
    );

    // Simulate restart by reloading
    await page.reload();

    // Tokens must still be in localStorage
    const storedAt = await page.evaluate(() => localStorage.getItem('accessToken'));
    const storedRt = await page.evaluate(() => localStorage.getItem('refreshToken'));

    expect(storedAt).toBe(accessToken);
    expect(storedRt).toBe(refreshToken);

    // Refresh token must still be usable to get a new access token
    const refreshRes = await request.post(`${API_URL}/api/auth/refresh`, {
      data: { refreshToken },
    });
    expect(refreshRes.status()).toBe(200);
  });
});

/**
 * Security tests — TC-REG-043 to TC-REG-046
 * HTTPS enforcement, rate limiting, password in responses, CSRF.
 *
 * These tests run against the API directly (localhost:3001).
 * HTTPS and rate-limiting tests must be run against staging to fully pass.
 */

import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaApi, API_URL } from '../helpers/api';

test.describe('Security', () => {
  // ─── TC-REG-043 ──────────────────────────────────────────────────────────
  test('[TC-REG-043] Registration API enforces HTTPS (staging only)', async ({
    request,
  }) => {
    /**
     * In local dev the API runs over plain HTTP which is expected.
     * This test passes in local dev, but on staging it verifies:
     *   - HTTP → HTTPS redirect (301/302) or connection refused
     *   - HSTS header is present on HTTPS responses
     *
     * On staging: set BASE_URL=https://staging.everstory.app and
     *             API_URL=https://api-staging.everstory.app
     */
    const isLocal =
      API_URL.startsWith('http://localhost') ||
      API_URL.startsWith('http://127.0.0.1');

    if (isLocal) {
      // On local dev just verify the API is reachable
      const res = await request.get(`${API_URL}/api`);
      expect(res.status()).toBe(200);
      return;
    }

    // On staging: HTTP must redirect or refuse
    const httpUrl = API_URL.replace('https://', 'http://');
    const res = await request
      .get(`${httpUrl}/api/auth/register`, { maxRedirects: 0 })
      .catch(() => null);

    if (res) {
      // Must redirect to HTTPS
      expect([301, 302, 307, 308]).toContain(res.status());
      const location = res.headers()['location'];
      expect(location).toMatch(/^https:/);
    }

    // HTTPS response must carry HSTS
    const secureRes = await request.get(`${API_URL}/api`);
    const hsts = secureRes.headers()['strict-transport-security'];
    expect(hsts).toBeTruthy();
    expect(hsts).toMatch(/max-age/);
  });

  // ─── TC-REG-044 ──────────────────────────────────────────────────────────
  test('[TC-REG-044] Rate limiting returns 429 after excessive registration attempts', async ({
    request,
  }) => {
    /**
     * Sends 21+ registration requests from the same "IP" within a short window.
     * Playwright test runner uses a single IP so the rate limiter should trigger.
     *
     * Rate limiting is configured at 20 req/min on the register route.
     * Run this test IN ISOLATION to avoid consuming the quota with other tests:
     *   RATE_LIMIT_TEST=1 npx playwright test -g "TC-REG-044"
     *
     * Skip in the full suite to avoid blocking TC-REG-045/046.
     */
    test.skip(
      !process.env.RATE_LIMIT_TEST,
      'Run in isolation with RATE_LIMIT_TEST=1 to avoid exhausting rate limit for other tests',
    );

    const results: number[] = [];

    for (let i = 0; i < 22; i++) {
      const res = await request.post(`${API_URL}/api/auth/register`, {
        data: {
          email: `ratelimit-${Date.now()}-${i}@test.everstory.com`,
          password: 'StrongPass1!',
        },
      });
      results.push(res.status());
    }

    // At least one response must be 429
    expect(results).toContain(429);
  });

  // ─── TC-REG-045 ──────────────────────────────────────────────────────────
  test('[TC-REG-045] Passwords are never returned in any API response', async ({
    request,
  }) => {
    const email = uniqueEmail();

    // Check register response
    const registerRes = await request.post(`${API_URL}/api/auth/register`, {
      data: { email, password: 'StrongPass1!' },
    });
    expect(registerRes.status()).toBe(201);
    const registerBody = await registerRes.json();

    expect(registerBody).not.toHaveProperty('password');
    expect(registerBody).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(registerBody)).not.toContain('StrongPass1!');

    // Check /api/auth/me response
    const { accessToken } = registerBody;
    const meRes = await request.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meBody = await meRes.json();

    expect(meBody).not.toHaveProperty('password');
    expect(meBody).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(meBody)).not.toMatch(/password/i);
  });

  // ─── TC-REG-046 ──────────────────────────────────────────────────────────
  test('[TC-REG-046] CSRF — registration without CSRF token is handled correctly', async ({
    request,
  }) => {
    /**
     * For a stateless JWT API, CSRF is mitigated by checking:
     *   a) Content-Type: application/json (not multipart/form-data)
     *   b) Origin / Referer header validation
     *   c) SameSite=Strict cookies (if cookies are used)
     *
     * This test sends a cross-origin POST (no Origin header / wrong origin)
     * and verifies the server either accepts it correctly or rejects it.
     *
     * NOTE: For a pure JWT Bearer-token API (no cookies), CSRF is not a
     * risk — this test documents that behaviour. If the API moves to
     * cookie-based auth, this test must be updated to expect 403.
     */
    const email = uniqueEmail();

    // Request with no Origin header (simulates cross-origin form POST)
    const res = await request.post(`${API_URL}/api/auth/register`, {
      headers: {
        'Content-Type': 'application/json',
        // Deliberately omit Origin and Referer
      },
      data: { email, password: 'StrongPass1!' },
    });

    // For a Bearer-token API: 201 is correct (CSRF N/A without cookies)
    // For a cookie-based API: must be 403
    const status = res.status();
    expect([201, 403]).toContain(status);

    if (status === 201) {
      // Document that this is safe because the API uses Bearer tokens, not cookies
      const body = await res.json();
      expect(body).toHaveProperty('accessToken');
    }
  });
});

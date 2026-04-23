/**
 * API helpers for E2E test setup and assertions.
 * Used to create/verify state without going through the UI.
 */

export const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Generate a unique email address safe to use for one test run. */
export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.everstory.com`;
}

/** Decode a JWT payload without verifying the signature. */
export function decodeJwt(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(base64, 'base64').toString('utf-8');
  return JSON.parse(json);
}

/** Register a user directly via the API (bypasses UI). */
export async function registerViaApi(
  email: string,
  password: string,
): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`registerViaApi failed ${res.status}: ${body}`);
  }
  return res.json();
}

/** Login directly via the API. */
export async function loginViaApi(
  email: string,
  password: string,
): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`loginViaApi failed ${res.status}: ${body}`);
  }
  return res.json();
}

/** Call GET /api/auth/me with the given access token. */
export async function getMe(
  accessToken: string,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return { status: res.status, body: res.ok ? await res.json() : null };
}

/** POST to /api/auth/register and return the raw Response (no throw). */
export async function rawRegister(
  email: string,
  password: string,
): Promise<Response> {
  return fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export async function registerUser(
  email: string,
  password: string
): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message ?? "Registration failed");
  }

  return data as AuthTokens;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message ?? "Login failed");
  }

  return data as AuthTokens;
}

export async function loginWithGoogle(token: string): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message ?? "Google Login failed");
  }

  return data as AuthTokens;
}

export function saveTokens(tokens: AuthTokens) {
  localStorage.setItem("accessToken", tokens.accessToken);
  localStorage.setItem("refreshToken", tokens.refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

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

export async function resendVerificationEmail(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Failed to resend verification email");
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    // Attempt to extract detailed error code/message if possible, e.g. RATE_LIMITED
    const data = await res.json().catch(() => ({}));
    if (data.code === 'RATE_LIMITED' && data.retryAfter) {
      throw new Error(`Слишком много запросов. Попробуйте снова через ${Math.ceil(data.retryAfter)} сек.`);
    }
    throw new Error(data.message ?? "Failed to request password reset");
  }
}

export async function validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
  const res = await fetch(`${API_URL}/api/auth/reset-password/${token}/validate`);
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Invalid or expired reset token");
  }
  
  const data = await res.json();
  return data;
}

export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Failed to reset password");
  }
}

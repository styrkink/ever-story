import { getAccessToken, clearTokens } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface Child {
  id: string;
  name: string;
  nickname?: string;
  birthDate: string;
  gender: string;
  interests: string[];
  characterTraits: string[];
  recentAchievements?: string;
  dreamsAndGoals?: string;
  petType?: string;
  petName?: string;
  hairColor?: string;
  eyeColor?: string;
  appearanceFeatures: string[];
  visibleFeatures: string[];
  specialNotes?: string;
  createdAt: string;
}

export interface StoryPage {
  id: string;
  pageNum: number;
  text: string;
  illustrationUrl?: string;
}

export interface Story {
  id: string;
  childId: string;
  theme: string;
  artStyle: string;
  status: "QUEUED" | "GENERATING" | "DONE" | "FAILED";
  pdfUrl?: string;
  createdAt: string;
  pages: StoryPage[];
  child: { name: string };
}

async function apiFetch<T>(
  path: string,
  options?: { method?: string; body?: unknown }
): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new AuthError("No token");

  const hasBody = options?.body !== undefined;
  const res = await fetch(`${API_URL}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    body: hasBody ? JSON.stringify(options!.body) : undefined,
  });

  if (res.status === 401) {
    clearTokens();
    throw new AuthError("Unauthorized");
  }

  const data = res.status === 204 ? null : await res.json();

  if (!res.ok) {
    throw new ApiError(data?.message ?? "Request failed", res.status);
  }

  return data as T;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function getChildren(): Promise<Child[]> {
  return apiFetch<Child[]>("/api/children");
}

export async function createChild(data: Partial<Child> & { name: string; birthDate: string; gender: string }): Promise<Child> {
  return apiFetch<Child>("/api/children", { method: "POST", body: data });
}

export async function patchChild(id: string, step: 1 | 2 | 3, data: Record<string, unknown>): Promise<Child> {
  return apiFetch<Child>(`/api/children/${id}?step=${step}`, { method: "PATCH", body: data });
}

export async function uploadChildPhoto(id: string, file: File): Promise<{ success: boolean; qualityScore: number }> {
  const token = getAccessToken();
  if (!token) throw new AuthError("No token");

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/api/children/${id}/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (res.status === 401) { clearTokens(); throw new AuthError("Unauthorized"); }

  const data = await res.json();
  if (!res.ok) throw new ApiError(data?.message ?? "Upload failed", res.status);
  return data;
}

export async function getStories(): Promise<Story[]> {
  const data = await apiFetch<{ stories: Story[] }>("/api/stories");
  return data.stories ?? [];
}

export async function createCoppaIntent(): Promise<{ clientSecret: string }> {
  const token = getAccessToken();
  if (!token) throw new AuthError("No token");

  const res = await fetch(`${API_URL}/api/auth/verify-coppa`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearTokens();
    throw new AuthError("Unauthorized");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.message ?? "Failed to create verification", res.status);
  }

  return data as { clientSecret: string };
}

export async function confirmCoppa(paymentIntentId: string): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new AuthError("No token");

  const res = await fetch(`${API_URL}/api/auth/confirm-coppa`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentIntentId }),
  });

  if (res.status === 401) {
    clearTokens();
    throw new AuthError("Unauthorized");
  }

  if (!res.ok) {
    const data = await res.json();
    throw new ApiError(data.message ?? "Failed to confirm verification", res.status);
  }
}

export function calcAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const adj =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
      ? 1
      : 0;
  const age = years - adj;
  if (age === 0) return "< 1 года";
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

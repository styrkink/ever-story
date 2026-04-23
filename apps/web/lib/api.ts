import { getAccessToken, clearTokens } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface Child {
  id: string;
  name: string;
  birthDate: string;
  interests: string[];
  petName?: string;
  petType?: string;
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

async function apiFetch<T>(path: string): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new AuthError("No token");

  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearTokens();
    throw new AuthError("Unauthorized");
  }

  const data = await res.json();

  if (!res.ok) {
    const err = new ApiError(data.message ?? "Request failed", res.status);
    throw err;
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

// ──────────────────────────────────────────
// KalanConnect Mobile — API Client
// ──────────────────────────────────────────

import * as SecureStore from "expo-secure-store";
import type { AuthTokens } from "@/types";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000/api/v1";
const TOKEN_KEY = "kalan_tokens";

// ── Token management (SecureStore for mobile) ──

export async function getTokens(): Promise<AuthTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function setTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ── API Fetch wrapper ──

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;
  constructor(status: number, data: Record<string, unknown>) {
    super(`API Error ${status}`);
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const tokens = await getTokens();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (tokens?.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Auto-refresh on 401
  if (response.status === 401 && tokens?.refresh) {
    const refreshRes = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      await setTokens({ access: data.access, refresh: tokens.refresh });
      headers["Authorization"] = `Bearer ${data.access}`;
      response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    } else {
      await clearTokens();
      throw new ApiError(401, { detail: "Session expirée" });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

export function getWsUrl(): string {
  return process.env.EXPO_PUBLIC_WS_URL || "ws://10.0.2.2:8000";
}

export const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
export const PUBLIC_SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || "https://www.karensurgery.com").replace(/\/$/, "");

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  roleCode: "SUPER_ADMIN" | "CONTENT_ADMIN" | "RECEPTION_OPERATIONS" | "READ_ONLY";
  roleName: string;
  permissions: string[];
}

// Stored strictly in memory (never localStorage) — auth itself relies on HttpOnly cookie
let memoryCsrfToken = "";

export function setCsrfToken(token: string) {
  memoryCsrfToken = token;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && memoryCsrfToken) {
    headers.set("X-CSRF-Token", memoryCsrfToken);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { error: text || `HTTP ${res.status}` };
  }

  if (!res.ok) {
    const errMsg =
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(errMsg);
  }

  return json as T;
}

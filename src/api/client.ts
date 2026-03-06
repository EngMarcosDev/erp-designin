import { resolveErpApiBase } from "@/lib/apiBase";

const API_BASE = resolveErpApiBase(import.meta.env.VITE_API_URL);
export const USE_MOCKS = import.meta.env.VITE_ENABLE_MOCKS === "true";

const joinUrl = (base: string, path: string) => {
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const getToken = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("erp_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
};

export async function apiGet<T>(path: string): Promise<T> {
  const url = joinUrl(API_BASE, path);
  const token = getToken();
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

const resolveDefaultApiBase = () => {
  if (typeof window === "undefined") return "/api/headshop";
  const host = window.location.hostname;
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.")
  ) {
    return "http://localhost:5050/api/headshop";
  }
  if (host.endsWith("abacaxita.com.br")) {
    return `https://${host}/api/headshop`;
  }
  return "/api/headshop";
};

export const API_BASE = import.meta.env.VITE_API_URL || resolveDefaultApiBase();
export const ERP_API_BASE = import.meta.env.VITE_ERP_API_URL || "/api/erp";

export const joinUrl = (base: string, path: string) => {
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const DEFAULT_TIMEOUT_MS = 10000;

export async function apiGetWithBase<T>(
  base: string,
  path: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const url = joinUrl(base, path);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  return apiGetWithBase<T>(API_BASE, path, timeoutMs);
}

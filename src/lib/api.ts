// Central API base resolution — no hardcoded localhost in production.
// Priority: NEXT_PUBLIC_API_URL env → relative proxy (production) → localhost fallback (dev)
export function getApiBase(): string {
  const env = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "http://127.0.0.1:8000";
    return "";
  }
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000";
  return "";
}

export const API_BASE = getApiBase();

export function apiUrl(path: string): string {
  const base = getApiBase();
  if (!path.startsWith("/")) path = "/" + path;
  return base ? `${base}${path}` : path;
}

export function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const t = localStorage.getItem("accessToken") || localStorage.getItem("access") || "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

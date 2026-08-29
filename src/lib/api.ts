// Central API base resolution — no hardcoded localhost in production.
// Priority: NEXT_PUBLIC_API_URL env → relative proxy (production) → localhost fallback (dev)
// Production (Vercel) MUST set NEXT_PUBLIC_API_URL=https://<render-backend>.onrender.com
// If not set, /api/* will route via Next.js rewrites (if built with env) or relative path (requires proxy).
export function getApiBase(): string {
  const env = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "http://127.0.0.1:8000";
    // Production fallback: if env not set at build, use hard-coded Render backend so /admin/login doesn't 404 on Vercel
    if (host.includes("vercel.app")) {
      return "https://vision-backend-llzj.onrender.com";
    }
    if (host.includes("vision")) {
      console.warn("[VISION] NEXT_PUBLIC_API_URL is not set — using fallback Render URL. Set it in Vercel → Environment Variables → Production → NEXT_PUBLIC_API_URL=https://vision-backend-llzj.onrender.com and redeploy.");
      return "https://vision-backend-llzj.onrender.com";
    }
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

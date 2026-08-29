"use client";
import { apiUrl } from "@/lib/api";

function adminHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const t = localStorage.getItem("adminToken") || "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function adminFetch(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...adminHeader(), ...(opts.headers as any || {}) };
  // Don't set Content-Type for FormData
  if (opts.body instanceof FormData) delete (headers as any)["Content-Type"];
  const res = await fetch(apiUrl(path), { ...opts, headers });
  if (res.status === 401) {
    // Clear token and redirect handled by caller
    const txt = await res.text().catch(() => "");
    let msg = txt;
    try { const j = JSON.parse(txt); msg = j.error || j.detail || txt; } catch {}
    throw new Error(msg || "Admin authentication required");
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    let msg = txt;
    try { const j = JSON.parse(txt); msg = j.error || j.detail || msg; } catch {}
    throw new Error(msg || `Request failed ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res;
}

export const adminApi = {
  login: (username: string, password: string) => adminFetch("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) }).then(r => r),
  me: () => adminFetch("/api/admin/me"),
  logout: () => adminFetch("/api/admin/logout", { method: "POST" }),
  dashboard: () => adminFetch("/api/admin/dashboard"),
  users: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return adminFetch(`/api/admin/users${qs ? "?" + qs : ""}`);
  },
  userDetail: (id: string) => adminFetch(`/api/admin/users/${id}`),
  knowledgeList: () => adminFetch("/api/admin/knowledge"),
  knowledgeCreateUrl: (data: any) => adminFetch("/api/admin/knowledge", { method: "POST", body: JSON.stringify(data) }),
  knowledgeDetail: (id: string) => adminFetch(`/api/admin/knowledge/${id}`),
  knowledgeUpdate: (id: string, data: any) => adminFetch(`/api/admin/knowledge/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  knowledgeDelete: (id: string) => adminFetch(`/api/admin/knowledge/${id}`, { method: "DELETE" }),
  knowledgeRefresh: (id: string) => adminFetch(`/api/admin/knowledge/${id}/refresh`, { method: "POST" }),
  jobs: () => adminFetch("/api/admin/jobs"),
  jobDetail: (id: string) => adminFetch(`/api/admin/jobs/${id}`),
  history: () => adminFetch("/api/admin/history"),
  activity: () => adminFetch("/api/admin/activity"),
  settings: () => adminFetch("/api/admin/settings"),
  updateSettings: (data: any) => adminFetch("/api/admin/settings", { method: "PATCH", body: JSON.stringify(data) }),
};

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adminToken");
}
export function setAdminToken(t: string) {
  if (typeof window !== "undefined") localStorage.setItem("adminToken", t);
}
export function clearAdminToken() {
  if (typeof window !== "undefined") localStorage.removeItem("adminToken");
}
export function isAdminLoggedIn(): boolean {
  return !!getAdminToken();
}

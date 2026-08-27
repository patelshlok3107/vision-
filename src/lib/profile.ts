import { apiUrl } from "@/lib/api";
function authHeader(): Record<string,string> {
  if (typeof window==="undefined") return {};
  const t = localStorage.getItem("accessToken") || localStorage.getItem("access") || "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}
export type Profile = {
  id: string; email: string; username: string; name: string;
  first_name: string; last_name: string; bio: string; avatar: string | null; date_joined: string | null;
};
export async function getProfile(): Promise<Profile> {
  const res = await fetch(apiUrl("/api/auth/profile/"), { headers: authHeader() });
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}
export async function updateProfile(data: { name?: string; username?: string; email?: string; bio?: string }): Promise<Profile> {
  const res = await fetch(apiUrl("/api/auth/profile/"), {
    method: "PATCH", headers: { "Content-Type":"application/json", ...authHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const j = await res.json().catch(()=>({detail:"Update failed"}));
    throw new Error(j.detail || "Update failed");
  }
  return res.json();
}
export async function uploadAvatar(file: File): Promise<{avatar:string}> {
  const fd = new FormData(); fd.append("avatar", file);
  const res = await fetch(apiUrl("/api/auth/avatar/"), { method:"POST", headers: authHeader(), body: fd });
  if (!res.ok) {
    const j = await res.json().catch(()=>({detail:"Upload failed"}));
    throw new Error(j.detail || "Upload failed");
  }
  return res.json();
}
export async function deleteAvatar(): Promise<void> {
  const res = await fetch(apiUrl("/api/auth/avatar/"), { method:"DELETE", headers: authHeader() });
  if (!res.ok) throw new Error("Delete failed");
}
export async function changePassword(current_password:string, new_password:string, confirm_password:string): Promise<void> {
  const res = await fetch(apiUrl("/api/auth/change-password/"), {
    method:"POST", headers: { "Content-Type":"application/json", ...authHeader() },
    body: JSON.stringify({ current_password, new_password, confirm_password })
  });
  if (!res.ok) {
    const j = await res.json().catch(()=>({detail:"Failed"}));
    throw new Error(j.detail || "Failed");
  }
}
export async function getDataStats(): Promise<{conversations:number; memory_items:number; files:number; storage_mb:number; storage_bytes:number}> {
  const res = await fetch(apiUrl("/api/auth/data/stats/"), { headers: authHeader() });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}
export async function exportData(): Promise<any> {
  const res = await fetch(apiUrl("/api/auth/data/export/"), { headers: authHeader() });
  if (!res.ok) throw new Error("Export failed");
  return res.json();
}

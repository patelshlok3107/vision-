const API = "http://127.0.0.1:8000";
function authHeader(): Record<string,string> {
  if (typeof window === "undefined") return {};
  const t = localStorage.getItem("accessToken") || localStorage.getItem("access") || "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}
export type Memory = {
  id: string;
  category: "preference"|"project"|"fact"|"instruction";
  content: string;
  importance: number;
  is_pinned: boolean;
  source_conversation: string | null;
  created_at: string;
  updated_at: string;
};
export async function listMemories(): Promise<Memory[]> {
  const res = await fetch(`${API}/api/memory/`, { headers: authHeader() });
  if (!res.ok) throw new Error("Failed to load memories");
  return res.json();
}
export async function createMemory(content: string, category: string = "fact"): Promise<Memory> {
  const res = await fetch(`${API}/api/memory/`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ content, category }) });
  if (!res.ok) throw new Error("Failed to create memory");
  return res.json();
}
export async function deleteMemory(id: string) {
  const res = await fetch(`${API}/api/memory/${id}/`, { method: "DELETE", headers: authHeader() });
  if (!res.ok) throw new Error("Delete failed");
}
export async function clearMemories() {
  const res = await fetch(`${API}/api/memory/clear/`, { method: "POST", headers: authHeader() });
  if (!res.ok) throw new Error("Clear failed");
  return res.json();
}
export async function togglePin(id: string, is_pinned: boolean) {
  const res = await fetch(`${API}/api/memory/${id}/`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ is_pinned }) });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

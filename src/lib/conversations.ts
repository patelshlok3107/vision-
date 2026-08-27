import { apiUrl } from "@/lib/api";

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const t = localStorage.getItem("accessToken") || localStorage.getItem("access") || "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  is_archived: boolean;
  message_count: number;
};

export type AttachmentOut = {
  id: string;
  file_name: string;
  mime_type: string;
  url: string;
  width?: number;
  height?: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_name?: string;
  tool_args?: any;
  tool_result?: string;
  created_at: string;
  metadata: any;
  attachments?: AttachmentOut[];
};

export async function listConversations(opts?: { include_archived?: boolean; limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (opts?.include_archived) qs.set("include_archived", "true");
  if (opts?.limit) qs.set("limit", String(opts.limit));
  if (opts?.offset) qs.set("offset", String(opts.offset));
  const res = await fetch(apiUrl(`/api/conversations/?${qs.toString()}`), { headers: authHeader() });
  if (!res.ok) throw new Error("Failed to list conversations");
  return (await res.json()) as Conversation[];
}

export async function createConversation(title?: string, first_message?: string) {
  const res = await fetch(apiUrl("/api/conversations/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ title, first_message }),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return (await res.json()) as Conversation;
}

export async function getConversation(id: string) {
  const res = await fetch(apiUrl(`/api/conversations/${id}/`), { headers: authHeader() });
  if (!res.ok) throw new Error("Not found");
  return (await res.json()) as Conversation;
}

export async function deleteConversation(id: string) {
  const res = await fetch(apiUrl(`/api/conversations/${id}/`), { method: "DELETE", headers: authHeader() });
  if (!res.ok) throw new Error("Delete failed");
}

export async function archiveConversation(id: string, is_archived?: boolean) {
  const res = await fetch(apiUrl(`/api/conversations/${id}/archive/`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(is_archived !== undefined ? { is_archived } : {}),
  });
  if (!res.ok) throw new Error("Archive failed");
  return (await res.json()) as Conversation;
}

export async function renameConversation(id: string, title: string) {
  const res = await fetch(apiUrl(`/api/conversations/${id}/rename/`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Rename failed");
  return (await res.json()) as Conversation;
}

export async function searchConversations(q: string) {
  const res = await fetch(apiUrl(`/api/conversations/search/?q=${encodeURIComponent(q)}`), { headers: authHeader() });
  if (!res.ok) return [];
  return (await res.json()) as Conversation[];
}

export async function getMessages(conversationId: string, limit = 50, offset = 0) {
  const res = await fetch(apiUrl(`/api/conversations/${conversationId}/messages/?limit=${limit}&offset=${offset}`), {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error("Failed to load messages");
  return (await res.json()) as { conversation_id: string; total: number; limit: number; offset: number; messages: Message[] };
}

export async function uploadAttachments(conversationId: string, files: File[]) {
  const fd = new FormData();
  files.forEach(f => fd.append("images", f));
  const token = (typeof window !== "undefined" ? localStorage.getItem("accessToken") || localStorage.getItem("access") || "" : "");
  const res = await fetch(apiUrl(`/api/conversations/${conversationId}/attachments/`), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(e.error || "Upload failed");
  }
  return (await res.json()) as AttachmentOut[];
}

export function attachmentUrl(url: string) {
  if (url.startsWith("http")) return url;
  const base = apiUrl("");
  return base ? `${base}${url}` : url;
}

// Guest history helpers - session storage for guest chat
export type GuestMessage = { role: "user" | "assistant"; content: string };
export function getGuestHistory(): GuestMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("vision_guest_history");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
export function saveGuestHistory(messages: GuestMessage[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem("vision_guest_history", JSON.stringify(messages.slice(-20))); } catch {}
}
export function appendGuestMessage(m: GuestMessage) {
  const h = getGuestHistory();
  h.push(m);
  saveGuestHistory(h);
}
export function clearGuestHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("vision_guest_history");
}

export async function streamChat(message: string, conversation_id: string | null, onToken: (t: string) => void, onStatus?: (s: string) => void, attachment_ids?: string[], signal?: AbortSignal, opts?: { mode?: string, memory_enabled?: boolean, onAgentStep?: (step: any) => void, onDiagnostics?: (diag: any) => void, onStreamStart?: (info: any) => void }) {
  const isGuest = typeof window !== "undefined" && !localStorage.getItem("accessToken") && !localStorage.getItem("access");
  const payload: any = { message, conversation_id, mode: opts?.mode || "auto", memory_enabled: opts?.memory_enabled ?? true };
  if (attachment_ids && attachment_ids.length) payload.attachment_ids = attachment_ids;
  if (isGuest) {
    const gh = getGuestHistory();
    if (gh.length) payload.guest_history = gh.slice(-6);
  }
  payload.request_id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + String(Math.random());
  const headers: Record<string,string> = { "Content-Type": "application/json" };
  const ah = authHeader();
  if (ah.Authorization) headers["Authorization"] = ah.Authorization;
  const res = await fetch(apiUrl("/api/ai/chat/"), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) {
    try {
      const j = await res.json();
      throw new Error(j.detail || j.error || j.message || res.statusText);
    } catch {
      const err = await res.text().catch(() => "");
      throw new Error(err || String(res.status));
    }
  }
  const reader = res.body?.getReader();
  if (!reader) return null;
  const dec = new TextDecoder();
  let buffer = "";
  let convId: string | null = conversation_id;
  let streamMode: string | null = null;

  while (true) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buffer += dec.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      let j: any;
      try { j = JSON.parse(line); } catch { continue; }
      if (j.type === "stream_start") {
        streamMode = j.content?.path || null;
        if (opts?.onStreamStart) opts.onStreamStart(j.content);
      }
      else if (j.type === "token") {
        const tok = j.content || "";
        if (tok) onToken(tok);
      }
      else if (j.type === "status" && onStatus) onStatus(j.content);
      else if (j.type === "agent_step" && opts?.onAgentStep) opts.onAgentStep(j.content);
      else if (j.type === "diagnostics") { if (opts?.onDiagnostics) opts.onDiagnostics(j.content); else console.log("[VISION Diagnostics]", j.content); }
      else if (j.type === "done" && j.conversation_id) convId = j.conversation_id;
      else if (j.type === "error") throw new Error(j.content);
    }
  }
  return convId;
}

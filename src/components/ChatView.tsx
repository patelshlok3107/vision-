"use client";
import { useEffect, useState, useRef, useCallback, useTransition } from "react";
import { apiUrl } from "@/lib/api";
import { unstable_batchedUpdates } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { getMessages, streamChat, createConversation, uploadAttachments, attachmentUrl, type Message, type AttachmentOut, getGuestHistory, saveGuestHistory, appendGuestMessage } from "@/lib/conversations";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import VoiceMicButton from "@/components/VoiceMicButton";
import VoiceWaveform from "@/components/VoiceWaveform";
import type { VISIONMode } from "@/components/ModeSelector";
import MemoryPanel from "@/components/MemoryPanel";
import WorkspacePanel from "@/components/WorkspacePanel";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ImageGenerationSkeleton from "@/components/ImageGenerationSkeleton";
import VisionLogo from "@/components/VisionLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/providers/AuthProvider";
import FeatureGateModal from "@/components/FeatureGateModal";
import AuthHeader from "@/components/AuthHeader";
import ConnectionStatus from "@/components/ConnectionStatus";
import { UpdateInlineBanner, UpdateHeaderIndicator } from "@/components/UpdateBanner";
import { getLocalSettings, saveLocalSettings } from "@/lib/settings";

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGES = 5;
const MAX_SIZE = 10 * 1024 * 1024;

function ToolBlock({ content, tool_name, tool_args, tool_result }: { content: string, tool_name?: string, tool_args?: any, tool_result?: string }) {
  // Try to parse tool_result as JSON for pretty rendering
  let resultObj: any = null;
  if (tool_result) {
    try { resultObj = JSON.parse(tool_result); } catch { resultObj = tool_result; }
  }
  const name = tool_name || (content.match(/"tool"\s*:\s*"([^"]+)"/)?.[1] || "tool");
  const icons: Record<string, string> = {
    calculator: "🧮", filesystem_list: "📁", filesystem_read: "📄", filesystem_write: "✏️", filesystem_delete: "🗑️",
    code_execution: "💻", terminal: "🖥️", web_search: "🌐", screenshot: "👁️", clipboard_read: "📋",
    open_path: "🖥️", clipboard_write: "📋", system_info: "ℹ️", image_investigation: "🔍"
  };
  const icon = icons[name] || "🔧";
  const isError = resultObj && typeof resultObj === "string" && resultObj.includes("Error");
  // Special renderers
  if (name === "calculator" && resultObj?.result !== undefined) {
    return <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-xs"><div className="text-white/50">{icon} calculator</div><div className="text-white font-mono text-sm mt-1">{resultObj.expression} = <span className="text-emerald-300">{String(resultObj.result)}</span></div></div>;
  }
  if (name === "filesystem_list" && resultObj?.entries) {
    return <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-xs"><div className="text-white/50">{icon} {name} — {resultObj.path}</div><div className="mt-2 space-y-1 font-mono">{resultObj.entries.map((e: any) => <div key={e.path} className={e.is_dir ? "text-emerald-300" : "text-white/70"}>{e.is_dir ? "📁" : "📄"} {e.name} <span className="text-white/30">({e.path})</span></div>)}</div><div className="text-white/30 mt-1">{resultObj.count} items</div></div>;
  }
  if (name === "filesystem_read" && resultObj?.content) {
    return <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-xs"><div className="text-white/50">{icon} read {resultObj.path}</div><pre className="mt-2 bg-black/40 rounded-lg p-3 overflow-auto max-h-64 text-white/80 whitespace-pre-wrap">{String(resultObj.content).slice(0, 2000)}</pre></div>;
  }
  if (name === "code_execution" && resultObj) {
    return <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-xs"><div className="text-white/50">{icon} code execution {resultObj.success ? "✓" : "✗"}</div>{resultObj.stdout && <pre className="mt-2 bg-emerald-500/10 rounded p-2 text-emerald-200 overflow-auto">{String(resultObj.stdout).slice(0, 1500)}</pre>}{resultObj.stderr && <pre className="mt-2 bg-red-500/10 rounded p-2 text-red-300 overflow-auto">{String(resultObj.stderr).slice(0, 1000)}</pre>}</div>;
  }
  if (name === "terminal" && resultObj) {
    return <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-xs"><div className="text-white/50">{icon} terminal: <span className="font-mono text-white/70">{resultObj.command}</span></div>{resultObj.stdout && <pre className="mt-2 bg-black rounded p-2 text-emerald-200 overflow-auto max-h-48">{String(resultObj.stdout).slice(0, 1500)}</pre>}{resultObj.stderr && <pre className="mt-1 text-red-300">{String(resultObj.stderr).slice(0, 600)}</pre>}</div>;
  }
  if (name === "web_search" && resultObj?.results) {
    return <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-xs"><div className="text-white/50">{icon} web search — {resultObj.query}</div><div className="mt-2 space-y-2">{resultObj.results.map((r: any, i: number) => <div key={i}><div className="text-white font-medium">{r.title}</div><div className="text-white/50">{r.snippet}</div></div>)}</div></div>;
  }
  if (name === "image_investigation" && resultObj?.results) {
    return <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-xs"><div className="text-white/50">{icon} image investigation — {resultObj.query}</div><div className="text-white/40 text-[11px] mt-1">{resultObj.scope}</div><div className="mt-2 space-y-3">{resultObj.results.map((r: any, i: number) => <div key={i} className="rounded-lg bg-black/30 p-3"><div className="flex justify-between"><span className="text-white font-medium">{i + 1}. {r.title}</span><span className={`px-2 py-0.5 rounded-full text-[10px] border ${r.match === "High" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : r.match === "Medium" ? "bg-amber-500/20 border-amber-500/30 text-amber-300" : "bg-white/5 border-white/10 text-white/50"}`}>{r.match}</span></div><div className="text-white/50 mt-1">{r.snippet}</div><div className="text-white/30 text-[11px] mt-1">{r.why}</div><a href={r.url} target="_blank" rel="noopener" className="text-emerald-300 underline text-xs mt-1 inline-block">Open source →</a></div>)}</div><div className="text-white/30 text-[11px] mt-2">{resultObj.note}</div></div>;
  }
  if (name === "open_path" && resultObj?.opened) {
    return <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-xs"><div className="text-white/50">{icon} opened — {resultObj.path}</div><div className="text-emerald-300 mt-1">✓ {resultObj.message}</div></div>;
  }
  if (name === "system_info" && resultObj?.platform) {
    return <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-xs"><div className="text-white/50">{icon} system info</div><div className="mt-2 font-mono text-white/70 space-y-1"><div>Platform: {resultObj.platform}</div><div>Workspace: {resultObj.workspace}</div><div>Free: {resultObj.workspace_free_mb} MB</div></div></div>;
  }
  // Fallback: show raw tool JSON + result
  return (
    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs">
      <div className="text-amber-300 font-medium">{icon} {name} {tool_args ? `— ${JSON.stringify(tool_args).slice(0, 120)}` : ""}</div>
      {resultObj && <pre className="mt-2 bg-black/30 rounded p-2 text-white/70 overflow-auto max-h-40 whitespace-pre-wrap">{typeof resultObj === "string" ? resultObj : JSON.stringify(resultObj, null, 2).slice(0, 1500)}</pre>}
      {!resultObj && <div className="text-white/50 mt-1 whitespace-pre-wrap">{content.slice(0, 500)}</div>}
    </div>
  );
}

function ImageGrid({ atts, onClick }: { atts: AttachmentOut[]; onClick?: (url: string) => void }) {
  if (!atts?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {atts.map(a => (
        <img key={a.id} src={attachmentUrl(a.url)} alt={a.file_name} onClick={() => onClick?.(attachmentUrl(a.url))} className="rounded-xl border border-white/10 object-cover cursor-pointer hover:opacity-80" style={{ width: 160, height: 120, objectFit: "cover" }} />
      ))}
    </div>
  );
}

function ThinkingDots({ text = "Thinking" }: { text?: string }) {
  const [dots, setDots] = useState("");
  useEffect(() => { const i = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 420); return () => clearInterval(i); }, []);
  return <span className="inline-flex items-center gap-1 animate-fadeIn"><span className="h-1.5 w-1.5 rounded-full bg-[var(--text)] thinking-dot" /><span className="text-xs tracking-wide" style={{color:"var(--muted)"}}>{text}</span><span className="w-4 text-left text-xs" style={{color:"var(--muted)"}}>{dots}</span></span>;
}

let _lastHealthFetch = 0;
let _cachedHealth: any = null;
let _lastRouterFetch = 0;
let _cachedRouter: any = null;
const HEALTH_CACHE_MS = 120000;

export default function ChatView({ conversationId }: { conversationId?: string }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  let initialFromQuery: string | null = null;
  try {
    const sp = useSearchParams();
    initialFromQuery = sp.get("initial");
  } catch { }
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState("");
  const [total, setTotal] = useState(0);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [pending, setPending] = useState<{ file: File, url: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voice = useVoiceInput({ lang: "en-US" });
  const [health, setHealth] = useState<any>(null);
  const [routerHealth, setRouterHealth] = useState<any>(null);
  const [lastFailed, setLastFailed] = useState<{ text: string, attachment_ids: string[], convId: string | null } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Phase 4: Mode + Memory — uses AppSettings as source of truth, falls back to legacy keys
  const [mode, setMode] = useState<VISIONMode>(() => {
    if (typeof window !== "undefined") {
      const legacy = localStorage.getItem("vision_mode") || localStorage.getItem("vision_think_mode") as VISIONMode;
      if (legacy) return legacy as VISIONMode;
      try { const s = getLocalSettings(); if (s.default_mode) return s.default_mode as VISIONMode; } catch {}
      return "auto";
    }
    return "auto";
  });
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const legacy = localStorage.getItem("vision_memory_enabled");
      if (legacy !== null) return legacy === "true";
      try { return getLocalSettings().memory_enabled ?? true; } catch { return true; }
    }
    return true;
  });
  const [showMemory, setShowMemory] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [agentSteps, setAgentSteps] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any | null>(null);
  const [streamStartInfo, setStreamStartInfo] = useState<any | null>(null);
  const [perfTimers, setPerfTimers] = useState<{sendTs: number; streamStartTs: number | null; firstTokenTs: number | null; streamEndTs: number | null} | null>(null);
  const [retrievedSources, setRetrievedSources] = useState<any[]>([]);
  const [proactive, setProactive] = useState(false);
  const [isPending, startTransition] = useTransition();
  // ── STREAMING OPTIMIZATION: isolated streaming state to avoid re-rendering entire message list per token ──
  const [streamingText, setStreamingText] = useState("");
  const streamingAccumRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const streamPathRef = useRef<string | null>(null);
  const [featureGate, setFeatureGate] = useState<{ open: boolean; feature?: string }>({ open: false });
  const [showImportBanner, setShowImportBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  useEffect(() => {
    const upd = () => setIsOffline(!navigator.onLine);
    upd();
    window.addEventListener("online", upd);
    window.addEventListener("offline", upd);
    return () => { window.removeEventListener("online", upd); window.removeEventListener("offline", upd); };
  }, []);
  // Check for guest import prompt after login
  useEffect(() => {
    if (isAuthenticated && !conversationId) {
      try {
        const gh = getGuestHistory();
        const hasImport = new URLSearchParams(window.location.search).has("import_guest");
        if (gh.length > 1 && hasImport) setShowImportBanner(true);
        else if (gh.length > 1 && messages.length === 0) {
          // also show if guest history exists and user just logged in, but don't be too intrusive
          // Only show if there are at least 2 messages (a conversation)
          const lastLogin = localStorage.getItem("vision_last_login_import_shown");
          const now = Date.now();
          if (!lastLogin || now - parseInt(lastLogin) > 60000) {
            setShowImportBanner(true);
          }
        }
      } catch {}
    }
  }, [isAuthenticated, conversationId, messages.length]);
  // Proactive: after 5 min idle, suggest
  useEffect(() => {
    if (streaming || messages.length === 0) return;
    const t = setTimeout(() => setProactive(true), 300000);
    return () => clearTimeout(t);
  }, [messages, streaming]);
  useEffect(() => {
    const now = Date.now();
    if (now - _lastHealthFetch < HEALTH_CACHE_MS && _cachedHealth !== null) {
      setHealth(_cachedHealth);
    } else {
      fetch(apiUrl("/api/ai/health/")).then(r => r.json()).then(d => { _cachedHealth = d; _lastHealthFetch = Date.now(); setHealth(d); }).catch(() => { });
    }
    const tk = localStorage.getItem("accessToken");
    if (tk) {
      if (now - _lastRouterFetch < HEALTH_CACHE_MS && _cachedRouter !== null) {
        setRouterHealth(_cachedRouter);
      } else {
        fetch(apiUrl("/api/ai/router/"), { headers: { Authorization: `Bearer ${tk}` } }).then(r => r.json()).then(d => { _cachedRouter = d; _lastRouterFetch = Date.now(); setRouterHealth(d); }).catch(() => { });
      }
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vision_mode", mode);
      try { saveLocalSettings({ default_mode: mode }); } catch {}
    }
  }, [mode]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vision_memory_enabled", String(memoryEnabled));
      try { saveLocalSettings({ memory_enabled: memoryEnabled }); } catch {}
    }
  }, [memoryEnabled]);

  // Sync server settings on auth (ensures theme/voice persist across logins)
  useEffect(() => {
    if (!isAuthenticated) return;
    try { import("@/lib/settings").then(m => m.fetchRemoteSettings().catch(()=>{})).catch(()=>{}); } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (voice.displayText) {
      setInput(voice.displayText);
      // auto-resize textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
        }
      }, 0);
    }
  }, [voice.displayText]);

  useEffect(() => {
    if (initialFromQuery && !conversationId) setInput(initialFromQuery);
  }, [initialFromQuery, conversationId]);

  const loadMessages = useCallback(async (limit = 50, offset = 0, append = false) => {
    if (!conversationId) return;
    const data = await getMessages(conversationId, limit, offset);
    setTotal(data.total);
    if (append) {
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newOnes = data.messages.filter(m => !existingIds.has(m.id));
        return [...newOnes, ...prev];
      });
    } else {
      const unique = Array.from(new Map(data.messages.map(m => [m.id, m])).values());
      setMessages(unique);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      // Remember last chat for authenticated user
      if (isAuthenticated && !conversationId.startsWith("guest_")) {
        try { localStorage.setItem("vision_last_chat_id", conversationId); } catch {}
      }
      loadMessages(50, 0, false);
    } else {
      if (isGuest) {
        // Load guest history from localStorage for ephemeral session
        try {
          const gh = getGuestHistory();
          if (gh.length) {
            const guestMsgs: Message[] = gh.map((g, i) => ({
              id: `guest-${i}-${g.role}`,
              conversation_id: "guest",
              role: g.role,
              content: g.content,
              created_at: new Date().toISOString(),
              metadata: {},
            }));
            setMessages(guestMsgs);
          } else {
            setMessages([]);
          }
        } catch { setMessages([]); }
      } else {
        setMessages([]);
      }
    }
  }, [conversationId, loadMessages, isAuthenticated, isGuest]);

  const isNearBottom = () => {
    const el = messagesRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useEffect(() => {
    try {
      const s = getLocalSettings();
      if (!s.auto_scroll) {
        if (messages.length > 0 && !isNearBottom()) setShowNewMessages(true);
        return;
      }
    } catch {}
    if (isNearBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowNewMessages(false);
    } else if (messages.length > 0) {
      setShowNewMessages(true);
    }
  }, [messages, streaming, voice.interim]);

  useEffect(() => { return () => voice.stop(); }, [voice]);

  // Keyboard-aware: keep composer above mobile keyboard (visualViewport)
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--keyboard-height", `${kb}px`);
      if (kb > 0) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.documentElement.style.setProperty("--keyboard-height", "0px");
    };
  }, []);

  // Regenerate image listener — sets input and focuses for quick send
  useEffect(() => {
    const handler = (e: any) => {
      const prompt = e.detail?.prompt;
      const text = prompt ? `Generate a new variation: ${prompt}` : "Generate a variation of the previous image with a fresh perspective";
      setInput(text);
      setTimeout(() => textareaRef.current?.focus(), 60);
    };
    window.addEventListener("vision:regenerate-image" as any, handler);
    return () => window.removeEventListener("vision:regenerate-image" as any, handler);
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // auto-resize: min 24px, max 120px (approx 5 lines)
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    try {
      const s = getLocalSettings();
      const enterToSend = s.enter_to_send ?? true;
      const shouldSend = enterToSend ? !e.shiftKey : (e.ctrlKey || e.metaKey);
      if (shouldSend) {
        e.preventDefault();
        handleSend();
        setTimeout(() => { if (textareaRef.current) textareaRef.current.style.height = "auto"; }, 0);
      }
    } catch {
      if (!e.shiftKey) { e.preventDefault(); handleSend(); setTimeout(() => { if (textareaRef.current) textareaRef.current.style.height = "auto"; }, 0); }
    }
  };

  // File validation
  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const valid: typeof pending = [];
    for (const f of arr) {
      if (!ALLOWED.includes(f.type)) { alert(`Unsupported file ${f.name}. Use JPG, PNG, WEBP, GIF.`); continue; }
      if (f.size > MAX_SIZE) { alert(`${f.name} is too large. Please choose an image under 10 MB.`); continue; }
      if (pending.length + valid.length >= MAX_IMAGES) { alert(`Maximum ${MAX_IMAGES} images per message`); break; }
      valid.push({ file: f, url: URL.createObjectURL(f) });
    }
    if (valid.length) setPending(p => [...p, ...valid].slice(0, MAX_IMAGES));
  };
  const handleScreenCapture = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) { alert("Screen capture not supported. Use Chrome/Edge."); return; }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true } as any);
      const track = stream.getVideoTracks()[0];
      const video = document.createElement("video");
      video.srcObject = stream; video.muted = true; await video.play();
      await new Promise(r => setTimeout(r, 300));
      const w = video.videoWidth || 1280, h = video.videoHeight || 720;
      const maxDim = 2048; let cw = w, ch = h;
      if (Math.max(w, h) > maxDim) { const s = maxDim / Math.max(w, h); cw = Math.round(w * s); ch = Math.round(h * s); }
      const canvas = document.createElement("canvas"); canvas.width = cw; canvas.height = ch;
      canvas.getContext("2d")!.drawImage(video, 0, 0, cw, ch);
      stream.getTracks().forEach(t => t.stop());
      const blob: Blob | null = await new Promise(res => canvas.toBlob(b => res(b), "image/png", 0.92));
      if (!blob) throw new Error("Failed");
      const file = new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" });
      addFiles([file]);
      setShowAttachMenu(false);
    } catch (e: any) { if (e?.name !== "NotAllowedError") alert(`Capture failed: ${e.message || e}`); }
  };

  const onPaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const it of Array.from(items)) {
      if (it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) { e.preventDefault(); addFiles(files); }
  }, [pending]);

  useEffect(() => {
    window.addEventListener("paste" as any, onPaste);
    return () => window.removeEventListener("paste" as any, onPaste);
  }, [onPaste]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && pending.length === 0) || streaming || sendingRef.current) return;
    sendingRef.current = true;
    if (voice.isListening) voice.stop();
    const pendingSnapshot = [...pending];
    setInput("");
    setPending([]);
    voice.reset();

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const sendStartTs = Date.now();
    const tempId = `temp-user-${sendStartTs}-${Math.random().toString(36).slice(2, 6)}`;
    const streamId = `stream-${sendStartTs}`;
    const previewUrls = pendingSnapshot.map(p => ({ id: `tmp-${p.file.name}`, file_name: p.file.name, mime_type: p.file.type, url: p.url, width: 80, height: 80 } as AttachmentOut));
    const tempUser: Message = { id: tempId, conversation_id: conversationId || "new", role: "user", content: text || "Image", created_at: new Date().toISOString(), metadata: {}, attachments: previewUrls };

    // ── INSTANT UI REACTION (<1ms) — user message + placeholder assistant ──
    setMessages(prev => [
      ...prev,
      tempUser,
      { id: streamId, conversation_id: conversationId || "", role: "assistant", content: "", created_at: new Date().toISOString(), metadata: { isStreamingPlaceholder: true }, attachments: [] }
    ]);
    setStreaming(true);
    setStreamingText("");
    streamingAccumRef.current = "";
    streamPathRef.current = null;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setStatus("");
    setDiagnostics(null);
    setAgentSteps([]);
    setStreamStartInfo(null);
    setRetrievedSources([]);
    setPerfTimers({ sendTs: sendStartTs, streamStartTs: null, firstTokenTs: null, streamEndTs: null });
    let firstTokenReceived = false;
    let assistant = "";
    let newConvId: string | null = conversationId || null;

    // ── GUEST vs AUTHENTICATED branching ──
    let attachment_ids: string[] = [];
    let convPromise: Promise<string | null> | null = null;
    let uploadPromise: Promise<string[]> | null = null;
    let tempIdFixed = tempId;
    let streamIdFixed = streamId;
    const _isGuestSend = isGuest;

    if (!_isGuestSend) {
      // AUTHENTICATED: Only create conversation upfront if images need upload; else let backend create it
      if (!conversationId && pendingSnapshot.length > 0) {
        convPromise = (async () => {
          try {
            const conv = await createConversation();
            const cid = conv.id;
            newConvId = cid;
            try { localStorage.setItem("vision_last_chat_id", cid); } catch {}
            setMessages(prev => prev.map(m => m.id === tempIdFixed || m.id === streamIdFixed ? { ...m, conversation_id: cid } : m));
            return cid;
          } catch { return null; }
        })();
      }
      if (pendingSnapshot.length) {
        uploadPromise = (async () => {
          try {
            const cid = convPromise ? await convPromise : newConvId;
            if (!cid) {
              const conv = await createConversation();
              newConvId = conv.id;
              try { localStorage.setItem("vision_last_chat_id", conv.id); } catch {}
              setMessages(prev => prev.map(m => m.id === tempIdFixed || m.id === streamIdFixed ? { ...m, conversation_id: conv.id } : m));
              const uploaded = await uploadAttachments(conv.id, pendingSnapshot.map(p => p.file));
              const ids = uploaded.map(a => a.id);
              setMessages(prev => prev.map(m => m.id === tempIdFixed ? { ...m, attachments: uploaded } : m));
              return ids;
            }
            const uploaded = await uploadAttachments(cid, pendingSnapshot.map(p => p.file));
            const ids = uploaded.map(a => a.id);
            setMessages(prev => prev.map(m => m.id === tempIdFixed ? { ...m, attachments: uploaded } : m));
            return ids;
          } catch (err: any) {
            setMessages(prev => prev.filter(m => m.id !== tempIdFixed).concat([{ id: `err-${Date.now()}`, conversation_id: newConvId || "", role: "assistant", content: err.message || "I couldn't upload that image. Please try again.", created_at: new Date().toISOString(), metadata: { error: true } }]));
            abortRef.current?.abort();
            return [];
          }
        })();
      }
    } else {
      // GUEST: do NOT create conversation or upload via DB; images will be sent via multipart FormData directly
      // For guest, keep newConvId null - backend will generate ephemeral guest id
      attachment_ids = [];
    }

    // Start streaming — for text-only we do NOT wait for conv creation at all
    try {
      // Only wait for upload when images are attached and authenticated
      let resolvedAttachIds: string[] | undefined = undefined;
      if (!_isGuestSend && pendingSnapshot.length && uploadPromise) {
        resolvedAttachIds = await uploadPromise;
        attachment_ids = resolvedAttachIds || [];
      }
      // Guest with images: use multipart streaming
      let returnedId: string | null = null;
      if (_isGuestSend && pendingSnapshot.length > 0) {
        // Guest multipart path
        const formData = new FormData();
        formData.append("message", text || "What's in this image?");
        if (newConvId) formData.append("conversation_id", newConvId);
        formData.append("mode", mode);
        formData.append("memory_enabled", "false");
        formData.append("request_id", typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
        // include guest history for context
        const gh = getGuestHistory();
        if (gh.length) formData.append("guest_history", JSON.stringify(gh.slice(-6)));
        pendingSnapshot.forEach(f => formData.append("images", f.file));
        // Custom fetch for guest multipart
        const guestRes = await fetch(apiUrl("/api/ai/chat/"), {
          method: "POST",
          body: formData,
          signal: abortRef.current.signal,
        });
        if (!guestRes.ok) {
          const txt = await guestRes.text().catch(() => "");
          let msg = txt;
          try { const j = JSON.parse(txt); msg = j.detail || j.error || txt; } catch {}
          throw new Error(msg || `Guest chat failed ${guestRes.status}`);
        }
        const reader = guestRes.body?.getReader();
        if (!reader) throw new Error("No stream");
        const dec = new TextDecoder();
        let buffer = "";
        let streamMode: string | null = null;
        while (true) {
          const { done: d, value } = await reader.read();
          if (d) break;
          buffer += dec.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let j: any; try { j = JSON.parse(line); } catch { continue; }
            if (j.type === "stream_start") { streamPathRef.current = j.content?.path || null; if (streamMode !== null) {} streamMode = j.content?.path || null; if (j.content && typeof j.content === "object") setStreamStartInfo(j.content); setPerfTimers(prev => prev ? { ...prev, streamStartTs: Date.now() } : prev); }
            else if (j.type === "token") {
              const tok = j.content || "";
              if (tok) { assistant += tok; streamingAccumRef.current += tok; if (!firstTokenReceived) { firstTokenReceived = true; setPerfTimers(prev => prev ? { ...prev, firstTokenTs: Date.now() } : prev); } const path = streamPathRef.current; if (path === "ultra_fast" || path === "simple" || path === "code" || path === "heavy" || path === "guest") setStreamingText(streamingAccumRef.current); else { if (!rafRef.current) rafRef.current = requestAnimationFrame(() => { rafRef.current = null; setStreamingText(streamingAccumRef.current); }); } setStatus(""); }
            } else if (j.type === "status") setStatus(j.content);
            else if (j.type === "image_generating") { setStatus("Creating your image..."); streamPathRef.current = "image_generation"; setStreamStartInfo({ path: "image_generation" }); }
            else if (j.type === "image") { const tok = `![Generated Image](${j.content.url || j.content})\n`; assistant += tok; streamingAccumRef.current += tok; setStreamingText(streamingAccumRef.current); setStatus(""); }
            else if (j.type === "done" && j.conversation_id) returnedId = j.conversation_id;
            else if (j.type === "error") throw new Error(j.content);
          }
        }
      } else {
        returnedId = await streamChat(text, newConvId, (token) => {
        assistant += token;
        streamingAccumRef.current += token;
        if (!firstTokenReceived) {
          firstTokenReceived = true;
          const now = Date.now();
          setPerfTimers(prev => prev ? { ...prev, firstTokenTs: now } : prev);
        }
        // ── OPTIMIZED RENDERING: ultra_fast/simple/code → immediate paint, others → RAF-batched (16ms) to avoid DOM thrash ──
        const path = streamPathRef.current;
        if (path === "ultra_fast" || path === "simple" || path === "code" || path === "heavy") {
          // Instant paint for fast/code — no batching, code appears within seconds
          setStreamingText(streamingAccumRef.current);
        } else {
          if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(() => {
              rafRef.current = null;
              setStreamingText(streamingAccumRef.current);
            });
          }
        }
        setStatus("");
      }, (s) => setStatus(s), attachment_ids.length ? attachment_ids : undefined, abortRef.current.signal, {
        mode: mode,
        memory_enabled: memoryEnabled,
        ...(() => { try { const s = getLocalSettings(); return { temperature: s.temperature, max_tokens: s.max_tokens, context_length: s.context_length, streaming: s.streaming, use_history_context: s.use_history_context, chat_history_enabled: s.chat_history_enabled, fast_mode: s.fast_mode, use_routing: s.use_routing, keep_warm: s.keep_warm }; } catch { return {}; } })(),
        onAgentStep: (st: any) => setAgentSteps(prev => [...prev, st]),
        onDiagnostics: (diag: any) => {
          setDiagnostics(diag);
          setPerfTimers(prev => prev ? { ...prev, streamEndTs: Date.now() } : prev);
        },
        onImage: (data: any) => {
          const url = data.url || data;
          const tok = `![Generated Image](${url})\n`;
          assistant += tok; streamingAccumRef.current += tok; setStreamingText(streamingAccumRef.current); setStatus("");
        },
        onImageGenerating: (data: any) => {
          setStatus("Creating your image..."); streamPathRef.current = "image_generation"; setStreamStartInfo({ path: "image_generation" });
        },
        onStreamStart: (info: any) => {
          streamPathRef.current = info?.path || null;
          setStreamStartInfo(info);
          setPerfTimers(prev => prev ? { ...prev, streamStartTs: Date.now() } : prev);
          console.log("[VISION] Stream started:", info, "latency:", Date.now() - sendStartTs, "ms");
        }
      });
      }
      // Flush any pending RAF and merge streamingText into messages
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      const finalText = streamingAccumRef.current || assistant;
      if (finalText) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.id === streamIdFixed) {
            const meta = { ...last.metadata };
            delete meta.isStreamingPlaceholder;
            return [...prev.slice(0, -1), { ...last, content: finalText, metadata: meta }];
          }
          return prev;
        });
      }
      setStreamingText("");
      streamingAccumRef.current = "";
      // Notify if backgrounded — respects notification settings
      try {
        if (typeof document !== "undefined" && document.hidden && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && finalText) {
          let allowed = true;
          try {
            const ns = getLocalSettings();
            const isCode = finalText.includes("```") || /<\/?html|function |const |import /.test(finalText);
            const isImage = pendingSnapshot.length > 0 || finalText.toLowerCase().includes("image");
            const isAgent = (streamPathRef.current === "agent") || agentSteps.length > 0;
            if (isCode && ns.notif_build_complete === false) allowed = false;
            else if (isAgent && ns.notif_agent_complete === false) allowed = false;
            else if (ns.notif_ai_complete === false) allowed = false;
            if (ns.notif_system === false) allowed = false;
          } catch {}
          if (!allowed) {
            // skip notification per user preference
          } else {
            const isCode = finalText.includes("```") || /<\/?html|function |const |import /.test(finalText);
            const isImage = pendingSnapshot.length > 0 || finalText.toLowerCase().includes("image");
            let body = "Your response is ready.";
            let tag = "vision-chat";
            if (isCode) { body = "Your code is ready."; tag = "vision-code"; }
            else if (isImage) { body = "Image analysis completed."; tag = "vision-image"; }
            if ("serviceWorker" in navigator) {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification("VISION", { body, icon: "/icons/icon-192.png", badge: "/icons/icon-72.png", tag, data: { url: newConvId ? `/chat/${newConvId}` : "/chat" } }).catch(()=>{});
              }).catch(()=>{});
            } else {
              new Notification("VISION", { body });
            }
          }
        }
      } catch {}
      // Autoplay voice if enabled
      try {
        const s = getLocalSettings();
        if (s.autoplay_voice && s.voice_enabled && finalText) {
          // Don't autoplay very long code blocks automatically — only short/medium responses
          if (finalText.length < 3000) {
            setTimeout(() => { try { speak(finalText, streamIdFixed); } catch {} }, 400);
          }
        }
      } catch {}

      if (_isGuestSend) {
        // Save guest history locally for session continuity
        try {
          appendGuestMessage({ role: "user", content: text || "Image" });
          if (finalText) appendGuestMessage({ role: "assistant", content: finalText });
        } catch {}
        // Guest: do NOT navigate to /chat/[id] (ephemeral) - stay at /chat
      } else {
        if (returnedId) newConvId = returnedId;
        if (newConvId) {
          try { localStorage.setItem("vision_last_chat_id", newConvId); } catch {}
          if (!conversationId) {
            router.push(`/chat/${newConvId}`);
          } else {
            await loadMessages(50, 0, false);
          }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setStatus("");
      } else {
        let msg = e.message || "";
        // Map known backend errors to user-friendly messages, keep backend's detailed message if already friendly
        if (msg.includes("VISION")) {
          // backend already sent a friendly error
        } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed")) {
          msg = "VISION's backend is currently unavailable. Please try again in a moment.";
        } else if (msg.toLowerCase().includes("cors")) {
          msg = "VISION couldn't connect due to a CORS error. Check that the backend allows https://vision-bice-sigma.vercel.app.";
        } else if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
          msg = "VISION couldn't authenticate your request. Try signing in again.";
        } else if (msg.includes("429")) {
          msg = "VISION is busy — rate-limited. Please retry shortly.";
        } else if (msg.includes("504") || msg.toLowerCase().includes("timeout")) {
          msg = "VISION's AI request timed out. The server may be waking up (cold start) — retry in a few seconds.";
        } else if (msg.includes("502") || msg.includes("503")) {
          msg = "VISION's backend is temporarily unavailable (server error). Retrying may help.";
        } else {
          msg = `VISION couldn't complete that request. ${msg}`;
        }
        // Append retry hint if backend is waking
        if (msg.toLowerCase().includes("cold") || msg.toLowerCase().includes("waking")) {
          msg += " [Retry]";
        }
        setLastFailed({ text, attachment_ids, convId: newConvId });
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== streamIdFixed);
          return [...filtered, { id: `err-${Date.now()}`, conversation_id: newConvId || "", role: "assistant", content: msg, created_at: new Date().toISOString(), metadata: { error: true } }];
        });
      }
    } finally {
      setStreaming(false);
      setStatus("");
      sendingRef.current = false;
      abortRef.current = null;
      pendingSnapshot.forEach(p => URL.revokeObjectURL(p.url));
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setStatus("");
    sendingRef.current = false;
  };

  const handleRetry = async () => {
    if (!lastFailed || streaming) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStreaming(true);
    setStatus("Retrying...");
    setAgentSteps([]);
    const streamId = `stream-${Date.now()}`;
    let assistant = "";
    setMessages(prev => {
      const filtered = prev.filter(m => !m.metadata?.error);
      return [...filtered, { id: streamId, conversation_id: lastFailed.convId || "", role: "assistant", content: "", created_at: new Date().toISOString(), metadata: { isStreamingPlaceholder: true }, attachments: [] }];
    });
    try {
      const returnedId = await streamChat(lastFailed.text, lastFailed.convId, (token) => {
        assistant += token;
        unstable_batchedUpdates(() => {
          startTransition(() => {
            setStatus("");
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.id === streamId) {
                const meta = { ...last.metadata };
                if (assistant.length > 0) delete meta.isStreamingPlaceholder;
                return [...prev.slice(0, -1), { ...last, content: assistant, metadata: meta }];
              }
              if (last?.role === "assistant" && last.id.startsWith("stream-")) {
                const meta: any = { ...last.metadata };
                if (assistant.length > 0) delete meta.isStreamingPlaceholder;
                return [...prev.slice(0, -1), { ...last, id: streamId, content: assistant, metadata: meta }];
              }
              return [...prev, { id: streamId, conversation_id: lastFailed.convId || "", role: "assistant", content: assistant, created_at: new Date().toISOString(), metadata: {} }];
            });
          });
        });
      }, (s) => setStatus(s), lastFailed.attachment_ids.length ? lastFailed.attachment_ids : undefined, abortRef.current.signal, { mode: mode, memory_enabled: memoryEnabled, onAgentStep: (st: any) => setAgentSteps(prev => [...prev, st]) });
      if (returnedId && lastFailed.convId) await loadMessages(50, 0, false);
      setLastFailed(null);
    } catch (e: any) {
      if (e.name !== 'AbortError') setMessages(prev => [...prev, { id: `err-${Date.now()}`, conversation_id: lastFailed.convId || "", role: "assistant", content: e.message, created_at: new Date().toISOString(), metadata: { error: true } }]);
    } finally { setStreaming(false); setStatus(""); abortRef.current = null; }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && messages.length < total) {
      loadMessages(50, messages.length, true);
    }
    if (isNearBottom()) setShowNewMessages(false);
  };

  // TTS — respects voice_enabled, voice_id, speech_speed
  const speak = (text: string, id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try { if (!getLocalSettings().voice_enabled) return; } catch {}
    window.speechSynthesis.cancel();
    if (speakingId === id) { setSpeakingId(null); return; }
    const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
    try {
      const s = getLocalSettings();
      const speedMap: any = { "0.75x": 0.75, "1x": 1, "1.25x": 1.25, "1.5x": 1.5, "2x": 2 };
      u.rate = speedMap[s.speech_speed] ?? 1;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length && s.voice_id && s.voice_id !== "system") {
        const want = s.voice_id.toLowerCase().includes("female") ? "female" : "male";
        const match = voices.find(v => v.name.toLowerCase().includes(want)) || voices.find(v => v.name.toLowerCase().includes("english"));
        if (match) u.voice = match;
      }
    } catch { u.rate = 1; }
    u.onstart = () => setSpeakingId(id); u.onend = () => setSpeakingId(null); u.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(u);
  };
  const copyMsg = async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(()=> setCopiedId(prev=> prev===id?null:prev), 1500); } catch {}
  };
  const handleRegenerate = async (assistantId: string) => {
    if (streaming) return;
    const idx = messages.findIndex(m=> m.id===assistantId);
    if (idx<=0) return;
    // find preceding user message
    for(let i=idx-1;i>=0;i--){
      if(messages[i].role==="user"){
        const txt = messages[i].content;
        // remove placeholder assistant and trigger send
        setInput(txt);
        // small delay then send? Instead directly call handleSend with txt
        // We will set input then call handleSend after state update via timeout
        setTimeout(()=> {
          // if input will be set, handleSend reads from input state, so need to bypass: set input then handleSend will read new input?
          // For now use direct streamChat path: simply re-send via handleSend logic using txt
          // quick path: set input and let user press send - but we want auto
          // fallback: set input then trigger handleSend in next tick using the txt directly
          const prevInput = txt;
          // temporarily override input via closure
          (async()=>{
            // mimic handleSend but with prevInput
            // Instead just set input and call handleSend after state settles
            setInput(prevInput);
            // wait a frame
            await new Promise(r=> setTimeout(r, 50));
            // call handleSend - it will read input state
            // To avoid race, we trigger handleSend directly with prevInput by temporarily setting input ref
            // We'll directly invoke handleSend logic by setting input and clicking
            // Simplest: create a synthetic send
            if(prevInput.trim()){
              // Use the existing handleSend but it reads input state; we already set it
              // Trigger via DOM: we could call handleSend after input update
              // For now just set input and don't auto-send; user can press send
            }
          })();
        }, 10);
        break;
      }
    }
    // Alternative simple: remove last assistant message and set last user as input, user presses send
    // We'll do: find last user, set input, remove last assistant placeholder? Keep it simple: set input
    const userBack = [...messages].reverse().find(m=> m.role==="user");
    if(userBack) setInput(userBack.content);
  };

  const ollamaOk = health?.ollama?.connected;
  const visionOk = health?.visionModel?.installed && health?.visionModel?.capable;
  const statusLine = !health ? "● Backend • Checking…" : health?.ollama?.connected === false ? "○ Backend Offline" : health?.ollama?.connected && !visionOk && health?.visionModel?.configured === false ? "● Backend Online • AI Ready" : health?.ollama?.connected && visionOk ? "● Backend Online • AI Ready" : "● Backend Online";

  // Empty state
  if (!conversationId && messages.length === 0) {
    return (
      <div className="chat-area" onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} data-streaming={streaming ? "true" : "false"}>
        {dragOver && <div className="absolute inset-0 z-20 bg-black/70 border-2 border-dashed border-white/20 flex items-center justify-center text-sm">Drop image to analyze</div>}
        <div className="chat-header hidden md:flex" style={{ justifyContent: "space-between", padding: "0 16px" }}>
          <div className="w-8" />
          <div className="text-center">
            <VisionLogo size={28} showText={true} className="justify-center" />
            <div className={`text-xs mt-1 ${!ollamaOk ? "text-red-400" : "text-emerald-300"}`}>{statusLine}</div>
          </div>
          <div className="flex items-center gap-2"><AuthHeader /><ThemeToggle /></div>
        </div>
        <div className="md:hidden flex items-center justify-center py-1.5 border-b text-[11px]" style={{ borderColor: "var(--border)", color: !ollamaOk ? "#ff5c5c" : "#6ee7b7" }}>{statusLine}</div>
        {isOffline && <div className="mx-4 mt-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-200 text-center">You're offline. The app shell is available, but AI responses need a connection.</div>}
        {isGuest && (
          <div className="mx-4 mt-3 rounded-xl border px-4 py-2.5 text-xs flex justify-between items-center" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}>
            <span>Guest mode — <span className="font-medium" style={{ color: "var(--text)" }}>basic chat only</span>. Conversations are not saved.</span>
            <a href="/login" className="ml-3 shrink-0 px-3 py-1 rounded-full text-xs font-medium" style={{ background: "var(--text)", color: "var(--bg)" }}>Sign in to save</a>
          </div>
        )}
        {showImportBanner && !isGuest && (
          <div className="mx-4 mt-3 rounded-xl border px-4 py-3 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
            <div>
              <div className="font-medium text-sm">Save this conversation to your VISION account?</div>
              <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>You have {getGuestHistory().length} guest messages. Import them to keep the history.</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={async () => {
                const gh = getGuestHistory();
                if (!gh.length) { setShowImportBanner(false); return; }
                try {
                  const firstUser = gh.find(m => m.role === "user")?.content || "Imported conversation";
                  const conv = await createConversation(firstUser.slice(0, 60));
                  // Save messages sequentially (user/assistant)
                  for (const m of gh) {
                    await fetch(apiUrl(`/api/conversations/${conv.id}/messages/`), {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
                      body: JSON.stringify({ role: m.role, content: m.content })
                    });
                  }
                  localStorage.removeItem("vision_guest_history");
                  try { localStorage.setItem("vision_last_chat_id", conv.id); } catch {}
                  setShowImportBanner(false);
                  router.push(`/chat/${conv.id}`);
                } catch (e: any) { alert(e.message || "Import failed"); }
              }} className="px-4 py-2 rounded-full text-xs font-medium" style={{ background: "var(--text)", color: "var(--bg)" }}>Save conversation</button>
              <button onClick={() => { localStorage.removeItem("vision_guest_history"); localStorage.setItem("vision_last_login_import_shown", String(Date.now())); setShowImportBanner(false); try { window.history.replaceState({}, "", "/chat"); } catch {} }} className="px-4 py-2 rounded-full border text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Start fresh</button>
            </div>
          </div>
        )}
        <div className="messages-container">
          <div className="empty-chat">
            <div className="text-center flex flex-col items-center">
              <VisionLogo size={56} showText={true} showSubtitle={true} className="mb-2" />
              <div className="text-xs text-emerald-300 mt-1">● Local AI Online</div>
              <h2 className="text-xl font-light mt-6">What can I help you with?</h2>
              {(() => { try { return getLocalSettings().show_suggested_prompts !== false; } catch { return true; } })() && (
              <div className="mt-6 grid grid-cols-2 gap-2 text-xs max-w-xs mx-auto">
                {["Explain something", "Write some code", "Analyze an image", "Help me solve a problem"].map(s => (
                  <button key={s} onClick={() => setInput(s)} className="rounded-full px-4 py-2 transition-colors" style={{ border: "1px solid var(--border)", color: "var(--text)", background: "transparent" }} onMouseEnter={e=>{ e.currentTarget.style.background="var(--button-bg)"; e.currentTarget.style.color="var(--button-text)"}} onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--text)"}}>{s}</button>
                ))}
              </div>
              )}
              <div className="text-xs mt-4" style={{ color: "var(--muted)" }}>Images are processed locally by Ollama</div>
            </div>
          </div>
        </div>
        <div className="composer-wrapper">
          {pending.length > 0 && (
            <div className="composer" style={{ background: "transparent", border: "none", paddingTop: 0 }}>
              <div className="flex gap-2 flex-wrap w-full">
                {pending.map((p, i) => (
                  <div key={i} className="relative">
                    <img src={p.url} alt="preview" className="rounded-xl border border-white/10 object-cover" style={{ width: 80, height: 80 }} />
                    <button onClick={() => setPending(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 h-5 w-5 rounded-full grid place-items-center text-xs" style={{ background: "var(--button-bg)", color: "var(--button-text)", border: "1px solid var(--border)" }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="composer">
            <div className="relative" style={{ overflow: "visible" }}>
              <button onClick={() => setShowAttachMenu(v => !v)} className="h-9 w-9 rounded-full grid place-items-center shrink-0 transition" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} onMouseEnter={e=> e.currentTarget.style.background="var(--surface-hover)"} onMouseLeave={e=> e.currentTarget.style.background="var(--surface)"} aria-label="Attach">＋</button>
              {showAttachMenu && (
                <div className="absolute bottom-12 left-0 bg-[#111113] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 w-[280px] text-sm" style={{ maxWidth: "280px" }}>
                  <div className="px-3 py-2 text-[10px] tracking-widest" style={{color:"var(--muted)"}}>ATTACH</div>
                  <button onClick={() => { setShowAttachMenu(false); fileRef.current?.click(); }} className="w-full text-left px-3 py-2.5 hover:bg-white/5 flex items-center gap-2">📷 <span>Upload image</span></button>
                  <button onClick={handleScreenCapture} className="w-full text-left px-3 py-2.5 hover:bg-white/5 flex items-center gap-2">◉ <span>Take Screenshot</span></button>
                  <div className="h-px bg-white/10 mx-3 my-2" />
                  <div className="px-3 py-1 text-[10px] tracking-widest" style={{color:"var(--muted)"}}>MODE</div>
                  <div className="px-2 pb-2 grid grid-cols-3 gap-1.5">
                    {(["auto","fast","think","code","agent"] as VISIONMode[]).map(m=> {
                      const active = mode===m;
                      const disabled = isGuest && (m==="agent" || m==="think") || routerHealth?.available?.[m]===false;
                      return <button key={m} disabled={!!disabled} onClick={()=>{ if(disabled){ setFeatureGate({open:true, feature:`${m} mode`}); return; } setMode(m); setShowAttachMenu(false); }} className={`px-2 py-1.5 rounded-full text-xs border capitalize ${active?"bg-white text-black border-white":"bg-white/5 border-white/10 hover:bg-white/10"} ${disabled?"opacity-30 cursor-not-allowed":""}`}>{m}</button>;
                    })}
                  </div>
                  <div className="h-px bg-white/10 mx-3 my-2" />
                  <div className="px-3 py-1 text-[10px] tracking-widest" style={{color:"var(--muted)"}}>TOOLS</div>
                  <button onClick={()=>{ if(isGuest){ setFeatureGate({open:true, feature:"Memory"}); return; } setMemoryEnabled(v=>!v); }} className="w-full flex justify-between items-center px-3 py-2 hover:bg-white/5 text-left">
                    <span>🧠 Memory</span><span className={`px-2 py-0.5 rounded-full text-xs border ${memoryEnabled?"bg-emerald-500/20 border-emerald-500/30 text-emerald-300":"bg-white/5 border-white/10 text-white/40"}`}>{memoryEnabled?"ON":"OFF"}</span>
                  </button>
                  <button onClick={()=>{ setShowAttachMenu(false); if(isGuest){ setFeatureGate({open:true, feature:"Memory"}); return; } setShowMemory(true); }} className="w-full text-left px-3 py-2 hover:bg-white/5">View Memory</button>
                  <button onClick={()=>{ setShowAttachMenu(false); if(isGuest){ setFeatureGate({open:true, feature:"Workspace"}); return; } setShowWorkspace(true); }} className="w-full text-left px-3 py-2 hover:bg-white/5">📁 Workspace</button>
                  <div className="px-3 py-2 flex justify-between items-center text-xs" style={{color:"var(--muted)"}}><span>Local</span><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-300">● LOCAL</span></div>
                </div>
              )}
            </div>
            <input ref={fileRef as any} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.currentTarget.value = ""; setShowAttachMenu(false); }} />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleTextareaKeyDown}
              placeholder={voice.isListening ? "Listening..." : "Ask VISION anything..."}
              rows={1}
              className="flex-1 bg-transparent outline-none text-sm resize-none max-h-[120px] min-h-[24px] py-2.5 leading-5 placeholder:text-white/30"
              style={{ color: "var(--text)" } as any}
              aria-label="Ask VISION"
            />
            {(() => { try { if (getLocalSettings().voice_enabled === false) return <button disabled title="Voice disabled — enable in Settings → Voice" className="h-10 w-10 rounded-full grid place-items-center shrink-0 opacity-40 border text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>🎙</button>; } catch {} return <VoiceMicButton isListening={voice.isListening} state={voice.state} onToggle={()=>{ try{ if(!getLocalSettings().voice_enabled) return; }catch{}; voice.toggle(); }} size={40} />; })()}
            {streaming ? <button onClick={handleStop} className="rounded-full px-5 py-2.5 text-sm shrink-0 font-medium min-h-[40px] min-w-[72px]" style={{ background: "var(--button-bg)", color: "var(--button-text)" }}>■ Stop</button> : <button onClick={() => { handleSend(); if (textareaRef.current) textareaRef.current.style.height = "auto"; }} disabled={!input.trim() && pending.length === 0} className="rounded-full px-5 py-2.5 text-sm shrink-0 font-medium disabled:opacity-40 min-h-[40px] min-w-[72px]" style={{ background: "var(--button-bg)", color: "var(--button-text)" }}>Send</button>}
          </div>
          {voice.isListening && <div className="flex justify-center py-2"><VoiceWaveform active /></div>}
          <div className="hidden md:flex justify-center mt-2"><span className="text-[10px] tracking-wide" style={{ color: "var(--muted)", opacity: 0.6 }}>{(() => { try { return getLocalSettings().enter_to_send === false ? "Ctrl+Enter to send • Enter for new line" : "↵ Enter to send • Shift+Enter for new line"; } catch { return "↵ Enter to send • Shift+Enter for new line"; } })()}</span></div>
          <div className="md:hidden flex justify-center mt-1.5"><span className="text-[10px]" style={{ color: "var(--muted)", opacity: 0.5 }}>Tap Send to submit</span></div>
          {voice.error && <div className="text-xs text-red-400 mt-2 text-center">{voice.error} <button onClick={voice.start} className="underline ml-2">Try Again</button></div>}
          {voice.isListening && <div className="text-[10px] tracking-widest text-red-400 mt-1 text-center">● Listening — Microphone active</div>}
        </div>
        {viewer && <div onClick={() => setViewer(null)} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"><img src={viewer} className="max-w-full max-h-full rounded-2xl" /><button className="absolute top-4 right-4 text-white">×</button></div>}
        <MemoryPanel open={showMemory} onClose={() => setShowMemory(false)} />
        <WorkspacePanel open={showWorkspace} onClose={() => setShowWorkspace(false)} />
        <FeatureGateModal open={featureGate.open} feature={featureGate.feature} onClose={() => setFeatureGate({ open: false })} />
      </div>
    );
  }

  return (
    <div className="chat-area" onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} data-streaming={streaming ? "true" : "false"}>
      {dragOver && <div className="absolute inset-0 z-20 bg-black/70 border-2 border-dashed border-white/20 flex items-center justify-center text-sm rounded-2xl m-4">Drop image to analyze</div>}
      <div className="chat-header hidden md:flex" style={{ justifyContent: "space-between", padding: "0 16px" }}>
        <div className="flex items-center gap-2">
          <UpdateHeaderIndicator />
        </div>
        <div className="text-center">
          <VisionLogo size={28} showText={true} className="justify-center" />
          <div className={`text-xs mt-1 ${!ollamaOk ? "text-red-400" : "text-emerald-300"}`}>{statusLine}</div>
        </div>
        <div className="flex items-center gap-2"><AuthHeader /><ThemeToggle /></div>
      </div>
      {/* Mobile status bar */}
      <div className="md:hidden flex items-center justify-center py-1.5 border-b text-[11px] gap-2" style={{ borderColor: "var(--border)", color: !ollamaOk ? "#ff5c5c" : "#6ee7b7" }}>
        <span>{statusLine}</span>
        <UpdateHeaderIndicator />
      </div>
      {isOffline && <div className="mx-4 mt-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-200 text-center">You're offline. The app shell is available, but AI responses need a connection.</div>}
      {isGuest && (
        <div className="mx-4 mt-3 rounded-xl border px-4 py-2.5 text-xs flex justify-between items-center" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}>
          <span>Guest mode — <span className="font-medium" style={{ color: "var(--text)" }}>basic chat only</span>. Conversations are not saved.</span>
          <a href="/login" className="ml-3 shrink-0 px-3 py-1 rounded-full text-xs font-medium" style={{ background: "var(--text)", color: "var(--bg)" }}>Sign in to save</a>
        </div>
      )}
      {showImportBanner && !isGuest && (
        <div className="mx-4 mt-3 rounded-xl border px-4 py-3 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
          <div>
            <div className="font-medium text-sm">Save this conversation to your VISION account?</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Import {getGuestHistory().length} guest messages.</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={async () => {
              const gh = getGuestHistory();
              if (!gh.length) { setShowImportBanner(false); return; }
              try {
                const firstUser = gh.find(m => m.role === "user")?.content || "Imported conversation";
                const conv = await createConversation(firstUser.slice(0, 60));
                for (const m of gh) {
                  await fetch(apiUrl(`/api/conversations/${conv.id}/messages/`), {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
                    body: JSON.stringify({ role: m.role, content: m.content })
                  });
                }
                localStorage.removeItem("vision_guest_history");
                try { localStorage.setItem("vision_last_chat_id", conv.id); } catch {}
                setShowImportBanner(false);
                router.push(`/chat/${conv.id}`);
              } catch (e: any) { alert(e.message || "Import failed"); }
            }} className="px-4 py-2 rounded-full text-xs font-medium" style={{ background: "var(--text)", color: "var(--bg)" }}>Save conversation</button>
            <button onClick={() => { localStorage.removeItem("vision_guest_history"); localStorage.setItem("vision_last_login_import_shown", String(Date.now())); setShowImportBanner(false); try { window.history.replaceState({}, "", "/chat"); } catch {} }} className="px-4 py-2 rounded-full border text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Start fresh</button>
          </div>
        </div>
      )}
      <div ref={messagesRef} onScroll={handleScroll} className="messages-container">
        <div className="chat-content">
          <div className="message-list">
            {(() => { try { return getLocalSettings().show_generation_status !== false; } catch { return true; } })() && status && <div className="text-center text-xs text-white/40 py-2 flex justify-center items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> <ThinkingDots text={status.replace(/\.\.\./g, "")} /></div>}
            {!status && (() => { const lastMsg = messages[messages.length - 1]; return lastMsg && lastMsg.role === "assistant" && lastMsg.content === "" && lastMsg.metadata?.isStreamingPlaceholder; })() && <div className="text-center text-xs text-white/30 py-2"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /></div>}
            {streaming && streamStartInfo?.path === "image_generation" && !streamingText && <div className="mx-2"><ImageGenerationSkeleton status={status || "Creating your image..."} /></div>}
            {agentSteps.length > 0 && <div className="mx-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs"><div className="font-medium text-amber-300">● Autonomous agent — {agentSteps.length} steps</div>{agentSteps.map((s: any, i: number) => <div key={i} className="flex gap-2 mt-1 text-white/70"><span className="text-emerald-400">✓</span> Step {s.step}/{s.max}: {s.tool} — {JSON.stringify(s.args).slice(0, 80)}</div>)}<div className="text-white/30 mt-1 text-[11px]">Showing high-level progress, not chain-of-thought</div></div>}
            {proactive && !streaming && <div className="mx-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs flex justify-between items-center"><span className="text-emerald-200">💡 VISION proactive: You've been idle. Want me to review your workspace for opportunities?</span><div className="flex gap-2"><button onClick={() => { setProactive(false); setInput("Review my workspace and suggest improvements"); }} className="px-3 py-1 rounded-full bg-white text-black text-xs">Review</button><button onClick={() => setProactive(false)} className="text-white/50">Dismiss</button></div></div>}
            {voice.isListening && <div className="flex justify-center py-2"><VoiceWaveform active /></div>}
            {voice.error && <div className="text-center text-xs text-red-400 py-2">{voice.error}</div>}
            {messages.map(m => {
              const isPlaceholder = !!(m.metadata?.isStreamingPlaceholder);
              const displayContent = isPlaceholder ? streamingText : m.content;
              const isActiveStreaming = streaming && isPlaceholder;
              return (
              <div key={m.id} className={`${m.role === "user" ? "message-user" : m.role === "tool" ? "" : "message-assistant"} rounded-2xl px-4 py-3 text-sm leading-relaxed message-enter`} style={m.role==="user" ? { background: "var(--button-bg)", color: "var(--button-text)" } : m.role==="tool" ? {} : { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }} >
                {m.attachments && m.attachments.length > 0 && <ImageGrid atts={m.attachments} onClick={setViewer} />}
                {m.role === "tool" ? <ToolBlock content={m.content} tool_name={(m as any).tool_name} tool_args={(m as any).tool_args} tool_result={(m as any).tool_result} /> : <><div className={m.role === "assistant" ? "" : "whitespace-pre-wrap"}>{m.role === "assistant" ? <MarkdownRenderer content={displayContent} isStreaming={isActiveStreaming} /> : m.content}</div>{m.role === "assistant" && displayContent && !m.metadata?.error && !isPlaceholder && (
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    <button onClick={() => copyMsg(displayContent, m.id)} className={`text-[11px] px-2.5 py-1 rounded-full border ${copiedId===m.id?"bg-white text-black border-white":"bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}>{copiedId===m.id?"Copied ✓":"Copy"}</button>
                    <button onClick={() => speak(displayContent, m.id)} className={`text-[11px] px-2.5 py-1 rounded-full border ${speakingId === m.id ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}>{speakingId === m.id ? "● Speaking..." : "▶ Speak"}</button>
                    <button onClick={() => {
                      const userBack = [...messages].reverse().find(x=> x.role==="user");
                      if(userBack) setInput(userBack.content);
                    }} className="text-[11px] px-2.5 py-1 rounded-full border bg-white/5 border-white/10 text-white/40 hover:bg-white/10">↻ Regenerate</button>
                  </div>
                )}</>}
                {m.metadata?.error && <div className="mt-2 flex gap-2"><button onClick={handleRetry} className="text-xs underline">Retry</button></div>}
              </div>
            )})}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
      {showNewMessages && <button onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })} className="mx-auto mb-2 bg-white text-black rounded-full px-4 py-1.5 text-xs">↓ New messages</button>}
      <div className="composer-wrapper">
        {pending.length > 0 && (
          <div className="w-[min(100%,760px)] mx-auto mb-2 flex gap-2 flex-wrap">
            {pending.map((p, i) => (
              <div key={i} className="relative">
                <img src={p.url} alt="preview" className="rounded-xl border border-white/10 object-cover" style={{ width: 80, height: 80, objectFit: "cover" }} />
                <button onClick={() => setPending(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 h-5 w-5 rounded-full grid place-items-center text-xs leading-none" style={{ background: "var(--button-bg)", color: "var(--button-text)", border: "1px solid var(--border)" }}>×</button>
              </div>
            ))}
          </div>
        )}
        <div className="composer">
            <div className="relative" style={{ overflow: "visible" }}>
              <button onClick={() => setShowAttachMenu(v => !v)} className="h-9 w-9 rounded-full grid place-items-center shrink-0 transition text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} onMouseEnter={e=> e.currentTarget.style.background="var(--surface-hover)"} onMouseLeave={e=> e.currentTarget.style.background="var(--surface)"} aria-label="Attach">＋</button>
            {showAttachMenu && (
                <div className="absolute bottom-12 left-0 bg-[#111113] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 w-[280px] text-sm" style={{ maxWidth: "280px" }}>
                <div className="px-3 py-2 text-[10px] tracking-widest" style={{color:"var(--muted)"}}>ATTACH</div>
                <button onClick={() => { setShowAttachMenu(false); fileRef.current?.click(); }} className="w-full text-left px-3 py-2.5 hover:bg-white/5 flex items-center gap-2">📷 <span>Upload image</span></button>
                <button onClick={handleScreenCapture} className="w-full text-left px-3 py-2.5 hover:bg-white/5 flex items-center gap-2">◉ <span>Take Screenshot</span></button>
                <div className="h-px bg-white/10 mx-3 my-2" />
                <div className="px-3 py-1 text-[10px] tracking-widest" style={{color:"var(--muted)"}}>MODE</div>
                <div className="px-2 pb-2 grid grid-cols-3 gap-1.5">
                  {(["auto","fast","think","code","agent"] as VISIONMode[]).map(m=> {
                    const active = mode===m;
                    const disabled = isGuest && (m==="agent" || m==="think") || routerHealth?.available?.[m]===false;
                    return <button key={m} disabled={!!disabled} onClick={()=>{ if(disabled){ setFeatureGate({open:true, feature:`${m} mode`}); return; } setMode(m); setShowAttachMenu(false); }} className={`px-2 py-1.5 rounded-full text-xs border capitalize ${active?"bg-white text-black border-white":"bg-white/5 border-white/10 hover:bg-white/10"} ${disabled?"opacity-30 cursor-not-allowed":""}`}>{m}</button>;
                  })}
                </div>
                <div className="h-px bg-white/10 mx-3 my-2" />
                <div className="px-3 py-1 text-[10px] tracking-widest" style={{color:"var(--muted)"}}>TOOLS</div>
                <button onClick={()=>{ if(isGuest){ setFeatureGate({open:true, feature:"Memory"}); return; } setMemoryEnabled(v=>!v); }} className="w-full flex justify-between items-center px-3 py-2 hover:bg-white/5 text-left">
                  <span>🧠 Memory</span><span className={`px-2 py-0.5 rounded-full text-xs border ${memoryEnabled?"bg-emerald-500/20 border-emerald-500/30 text-emerald-300":"bg-white/5 border-white/10 text-white/40"}`}>{memoryEnabled?"ON":"OFF"}</span>
                </button>
                <button onClick={()=>{ setShowAttachMenu(false); if(isGuest){ setFeatureGate({open:true, feature:"Memory"}); return; } setShowMemory(true); }} className="w-full text-left px-3 py-2 hover:bg-white/5">View Memory</button>
                <button onClick={()=>{ setShowAttachMenu(false); if(isGuest){ setFeatureGate({open:true, feature:"Workspace"}); return; } setShowWorkspace(true); }} className="w-full text-left px-3 py-2 hover:bg-white/5">📁 Workspace</button>
                <div className="px-3 py-2 flex justify-between items-center text-xs" style={{color:"var(--muted)"}}><span>Local</span><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-300">● LOCAL</span></div>
              </div>
            )}
          </div>
          <input ref={fileRef as any} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.currentTarget.value = ""; setShowAttachMenu(false); }} />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleTextareaKeyDown}
            placeholder={voice.isListening ? "Listening..." : "Ask VISION anything..."}
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm resize-none max-h-[120px] min-h-[24px] py-2.5 leading-5 placeholder:text-white/30"
            style={{ color: "var(--text)" } as any}
            aria-label="Ask VISION"
          />
          {(() => { try { if (getLocalSettings().voice_enabled === false) return <button disabled title="Voice disabled — enable in Settings → Voice" className="h-10 w-10 rounded-full grid place-items-center shrink-0 opacity-40 border text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>🎙</button>; } catch {} return <VoiceMicButton isListening={voice.isListening} state={voice.state} onToggle={()=>{ try{ if(!getLocalSettings().voice_enabled) return; }catch{}; voice.toggle(); }} size={40} />; })()}
          {streaming ? <button onClick={handleStop} className="rounded-full px-5 py-2.5 text-sm shrink-0 font-medium min-h-[40px] min-w-[72px]" style={{ background: "var(--button-bg)", color: "var(--button-text)" }}>■ Stop</button> : <button onClick={() => { handleSend(); if (textareaRef.current) textareaRef.current.style.height = "auto"; }} disabled={!input.trim() && pending.length === 0} className="rounded-full px-5 py-2.5 text-sm shrink-0 font-medium disabled:opacity-40 min-h-[40px] min-w-[72px]" style={{ background: "var(--button-bg)", color: "var(--button-text)" }}>Send</button>}
        </div>
        {voice.error && <div className="text-xs text-red-400 mt-2 text-center">{voice.error} <button onClick={voice.start} className="underline ml-2">Try Again</button></div>}
        {voice.isListening && <div className="text-[10px] tracking-widest text-red-400 mt-1 text-center">● Listening — Microphone active</div>}
        <div className="hidden md:flex justify-center mt-2"><span className="text-[10px] tracking-wide" style={{ color: "var(--muted)", opacity: 0.6 }}>{(() => { try { return getLocalSettings().enter_to_send === false ? "Ctrl+Enter to send • Enter for new line" : "↵ Enter to send • Shift+Enter for new line"; } catch { return "↵ Enter to send • Shift+Enter for new line"; } })()}</span></div>
        <div className="md:hidden flex justify-center mt-1.5"><span className="text-[10px]" style={{ color: "var(--muted)", opacity: 0.5 }}>Tap Send to submit</span></div>
      </div>
      {viewer && <div onClick={() => setViewer(null)} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8" onKeyDown={e => e.key === "Escape" && setViewer(null)}><img src={viewer} alt="full" className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain" /><button aria-label="Close image viewer" className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white text-black grid place-items-center text-sm" style={{ top: "max(16px, env(safe-area-inset-top))", right: "max(16px, env(safe-area-inset-right))" }}>×</button></div>}
      <MemoryPanel open={showMemory} onClose={() => setShowMemory(false)} />
      <WorkspacePanel open={showWorkspace} onClose={() => setShowWorkspace(false)} />
      <FeatureGateModal open={featureGate.open} feature={featureGate.feature} onClose={() => setFeatureGate({ open: false })} />
    </div>
  );
}

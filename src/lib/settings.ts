const API = "http://127.0.0.1:8000";
function authHeader(): Record<string,string> {
  if (typeof window==="undefined") return {};
  const t = localStorage.getItem("accessToken") || localStorage.getItem("access") || "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}
export type AppSettings = {
  language: string; default_mode: string; enter_to_send: boolean; show_suggested_prompts: boolean; auto_scroll: boolean; confirm_delete: boolean;
  theme: string; chat_density: string; animations: boolean; reduce_motion: boolean; font_size: string;
  voice_enabled: boolean; voice_id: string; speech_speed: string; autoplay_voice: boolean;
  chat_model: string; code_model: string; vision_model: string; reasoning_model: string; agent_model: string;
  temperature: number; context_length: number; streaming: boolean; show_generation_status: boolean;
  fast_mode: boolean; use_routing: boolean; keep_warm: boolean; max_tokens: number;
  chat_history_enabled: boolean; memory_enabled: boolean; save_files: boolean; use_history_context: boolean; analytics: boolean; personalization: boolean;
  notif_ai_complete: boolean; notif_agent_complete: boolean; notif_build_complete: boolean; notif_research_complete: boolean; notif_system: boolean; notif_email: boolean;
  [k:string]: any;
};

const LOCAL_KEY = "vision_app_settings";
const defaults: AppSettings = {
  language:"en", default_mode:"auto", enter_to_send:true, show_suggested_prompts:true, auto_scroll:true, confirm_delete:true,
  theme:"system", chat_density:"comfortable", animations:true, reduce_motion:false, font_size:"medium",
  voice_enabled:true, voice_id:"vision-male", speech_speed:"1x", autoplay_voice:false,
  chat_model:"", code_model:"", vision_model:"", reasoning_model:"", agent_model:"",
  temperature:0.2, context_length:8192, streaming:true, show_generation_status:true,
  fast_mode:true, use_routing:true, keep_warm:true, max_tokens:2048,
  chat_history_enabled:true, memory_enabled:true, save_files:true, use_history_context:true, analytics:false, personalization:true,
  notif_ai_complete:true, notif_agent_complete:true, notif_build_complete:true, notif_research_complete:true, notif_system:true, notif_email:false,
};

export function getLocalSettings(): AppSettings {
  if (typeof window==="undefined") return defaults;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch { return defaults; }
}
export function saveLocalSettings(s: Partial<AppSettings>) {
  if (typeof window==="undefined") return;
  const cur = getLocalSettings();
  const next = { ...cur, ...s };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  // apply theme/font/reduce-motion side-effects
  applySettingsSideEffects(next);
  return next;
}
export function applySettingsSideEffects(s: AppSettings) {
  if (typeof document==="undefined") return;
  // theme
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = s.theme === "system" ? (prefersDark ? "dark" : "light") : s.theme;
  document.documentElement.classList.toggle("dark", theme==="dark");
  document.documentElement.classList.toggle("light", theme==="light");
  localStorage.setItem("vision-theme", s.theme === "system" ? (prefersDark?"dark":"light") : s.theme);
  // font size
  document.documentElement.style.setProperty("--vision-font-scale", s.font_size==="small"?"0.9":s.font_size==="large"?"1.08":"1");
  document.documentElement.dataset.density = s.chat_density;
  if (s.reduce_motion) document.documentElement.style.setProperty("--transition","0s");
  else document.documentElement.style.removeProperty("--transition");
}
export async function fetchRemoteSettings(): Promise<AppSettings|null> {
  const t = typeof window!=="undefined" ? localStorage.getItem("accessToken") : null;
  if (!t) return null;
  try {
    const res = await fetch(`${API}/api/auth/settings/`, { headers: authHeader() });
    if (!res.ok) return null;
    const remote = await res.json();
    // merge remote over local
    const merged = { ...getLocalSettings(), ...remote };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
    applySettingsSideEffects(merged);
    return merged;
  } catch { return null; }
}
export async function pushRemoteSettings(patch: Partial<AppSettings>): Promise<boolean> {
  const t = typeof window!=="undefined" ? localStorage.getItem("accessToken") : null;
  if (!t) { saveLocalSettings(patch); return true; }
  try {
    const res = await fetch(`${API}/api/auth/settings/`, {
      method:"PATCH", headers: { "Content-Type":"application/json", ...authHeader() },
      body: JSON.stringify(patch)
    });
    if (!res.ok) return false;
    saveLocalSettings(patch);
    return true;
  } catch {
    saveLocalSettings(patch);
    return false;
  }
}
export { defaults };

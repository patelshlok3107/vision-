"use client";
import { useEffect, useState, useMemo } from "react";
import { apiUrl } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import VisionLogo from "@/components/VisionLogo";
import ThemeToggle from "@/components/ThemeToggle";
import VersionInfo from "@/components/VersionInfo";
import { getLocalSettings, saveLocalSettings, applySettingsSideEffects, fetchRemoteSettings, pushRemoteSettings, defaults } from "@/lib/settings";
import { listMemories, createMemory, deleteMemory, clearMemories, togglePin, type Memory } from "@/lib/memory";
import { getDataStats, exportData } from "@/lib/profile";

// ---------- small primitives ----------
function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b" style={{borderColor:"var(--border)"}}>
      <div className="min-w-0 flex-1">
        <div className="text-sm" style={{color:"var(--text)"}}>{label}</div>
        {desc && <div className="text-xs mt-1 leading-relaxed" style={{color:"var(--muted)"}}>{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v:boolean)=>void; label?: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label}
      onClick={()=> onChange(!checked)}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition ${checked ? "bg-[var(--text)]" : "bg-[var(--surface-2)] border"}`}
      style={checked?undefined:{borderColor:"var(--border)"}}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? "translate-x-5 bg-[var(--bg)]" : "translate-x-1"}`} style={checked?{background:"var(--bg)"}:{background:"var(--text)"}} />
    </button>
  );
}
function Select({ value, onChange, options }: { value: string; onChange:(v:string)=>void; options:{label:string,value:string}[] }) {
  return (
    <select value={value} onChange={e=> onChange(e.target.value)} className="rounded-xl px-3 py-2 text-sm border outline-none" style={{background:"var(--surface)", borderColor:"var(--border)", color:"var(--text)"}}>
      {options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function Section({ title, desc, children }: { title:string; desc?:string; children:React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5 md:p-6" style={{background:"var(--surface)", borderColor:"var(--border)"}}>
      <h3 className="text-sm font-medium" style={{color:"var(--text)"}}>{title}</h3>
      {desc && <p className="text-xs mt-1" style={{color:"var(--muted)"}}>{desc}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const NAV = [
  { id:"general", label:"General" },
  { id:"appearance", label:"Appearance" },
  { id:"voice", label:"Voice" },
  { id:"ai", label:"AI & Models" },
  { id:"performance", label:"Performance" },
  { id:"privacy", label:"Privacy" },
  { id:"memory", label:"Memory" },
  { id:"notifications", label:"Notifications" },
  { id:"data", label:"Data" },
  { id:"security", label:"Security" },
  { id:"about", label:"About" },
] as const;

export default function SettingsPage(){
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<string>("general");
  const [mobileView, setMobileView] = useState<null|string>(null);
  const [settings, setSettings] = useState(defaults);
  const [savedTick, setSavedTick] = useState(false);
  const [query, setQuery] = useState("");
  // AI health
  const [aiCfg, setAiCfg] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [perf, setPerf] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [testRes, setTestRes] = useState<any>(null);
  const [models, setModels] = useState<string[]>([]);
  // memory
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memLoading, setMemLoading] = useState(false);
  const [newMem, setNewMem] = useState("");
  const [newCat, setNewCat] = useState("fact");
  // data
  const [stats, setStats] = useState<any>(null);
  const [notifPerm, setNotifPerm] = useState<string>("default");
  // security
  const [pwd, setPwd] = useState({ cur:"", nw:"", conf:"" });
  const [pwdMsg, setPwdMsg] = useState<string|null>(null);

  // load settings + remote
  useEffect(()=>{
    const local = getLocalSettings();
    setSettings(local);
    applySettingsSideEffects(local);
    fetchRemoteSettings().then(r=> { if(r) setSettings(r); });
    // health
    fetch(apiUrl("/api/ai/health/")).then(r=>r.json()).then(setHealth).catch(()=>{});
    const t = localStorage.getItem("accessToken");
    const h:any = t?{Authorization:`Bearer ${t}`}:undefined;
    fetch(apiUrl("/api/ai/settings/"),{headers:h}).then(r=>r.json()).then(setAiCfg).catch(()=>{});
    fetch(apiUrl("/api/ai/performance/"),{headers:h}).then(r=>r.json()).then(setPerf).catch(()=>{});
    fetch(apiUrl("/api/ai/usage/"),{headers:h}).then(r=>r.json()).then(setUsage).catch(()=>{});
    // models list
    fetch(apiUrl("/api/ai/health/"),{headers:h}).then(r=>r.json()).then(()=> {
      // get models via tags
      const base = aiCfg?.ollama_url || apiUrl("");
      fetch(apiUrl("/api/ai/settings/"),{headers:h}).then(r=>r.json()).then(j=>{
        // fallback: use health models if available
      }).catch(()=>{});
    }).catch(()=>{});
    // notification perm
    try{ if("Notification" in window) setNotifPerm(Notification.permission); }catch{}
    // memories + stats if authed
    if (localStorage.getItem("accessToken")) {
      setMemLoading(true);
      listMemories().then(setMemories).catch(()=>{}).finally(()=> setMemLoading(false));
      fetch(apiUrl("/api/auth/data/stats/"),{headers:h}).then(r=>r.json()).then(setStats).catch(()=>{});
    }
  },[]);

  useEffect(()=>{ if(mobileView) setActive(mobileView); },[mobileView]);

  const update = (patch: any) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveLocalSettings(patch);
    pushRemoteSettings(patch);
    setSavedTick(true); setTimeout(()=> setSavedTick(false), 1200);
  };

  const filteredNav = useMemo(()=>{
    if (!query.trim()) return NAV as any;
    const q = query.toLowerCase();
    const map: Record<string,string[]> = {
      general:["language","mode","enter","suggested","auto-scroll","delete"],
      appearance:["theme","dark","light","system","density","compact","comfortable","animations","reduce motion","font"],
      voice:["voice","speech","speed","autoplay","microphone","test"],
      ai:["model","chat","code","vision","reasoning","agent","temperature","context","streaming","generation"],
      performance:["fast","routing","warm","tokens","stream","keep warm"],
      privacy:["privacy","history","memory","files","analytics","personalization"],
      memory:["memory","remember","fact","preference","project"],
      notifications:["notifications","ai complete","agent","build","research","email","system"],
      data:["data","storage","export","conversations","files","delete","clear"],
      security:["security","password","sessions","verification"],
      about:["about","version","ollama","documentation","terms","github"],
    };
    return (NAV as any).filter((n:any)=> n.label.toLowerCase().includes(q) || (map[n.id]?.some(k=>k.includes(q))));
  },[query]);

  const handleTestVoice = () => {
    if (!settings.voice_enabled) { setTestRes({error:"Voice is currently unavailable."}); return; }
    try{
      const text = "Hello, this is VISION. Your personal AI assistant.";
      const u = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices();
      if (voices.length) {
        const v = voices.find(v=> v.name.toLowerCase().includes("male")) || voices[0];
        if (v) u.voice = v;
      }
      const speedMap: any = {"0.75x":0.75,"1x":1,"1.25x":1.25,"1.5x":1.5,"2x":2};
      u.rate = speedMap[settings.speech_speed] || 1;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
      setTestRes({success:true});
    }catch(e:any){ setTestRes({error:String(e)}); }
  };

  const handleExport = async () => {
    try{
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url; a.download=`vision-export-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
    }catch{ alert("Export failed"); }
  };

  const isMobile = typeof window!=="undefined" ? window.innerWidth < 768 : false;

  // Render helpers for each section
  const renderGeneral = () => (
    <div className="space-y-4">
      <Section title="General" desc="Core interaction preferences">
        <Row label="Language" desc="Interface language"><Select value={settings.language} onChange={v=> update({language:v})} options={[{label:"English",value:"en"},{label:"Hindi",value:"hi"},{label:"Spanish",value:"es"}]} /></Row>
        <Row label="Default AI Mode" desc="Applied to new conversations"><Select value={settings.default_mode} onChange={v=> update({default_mode:v})} options={[{label:"Auto",value:"auto"},{label:"Fast",value:"fast"},{label:"Think",value:"think"},{label:"Code",value:"code"},{label:"Agent",value:"agent"}]} /></Row>
        <Row label="Enter to send" desc="Press Enter to send, Shift+Enter for new line"><Switch checked={settings.enter_to_send} onChange={v=> update({enter_to_send:v})} /></Row>
        <Row label="Show suggested prompts" desc="Display starter prompts on empty chat"><Switch checked={settings.show_suggested_prompts} onChange={v=> update({show_suggested_prompts:v})} /></Row>
        <Row label="Auto-scroll chat" desc="Automatically scroll to new messages"><Switch checked={settings.auto_scroll} onChange={v=> update({auto_scroll:v})} /></Row>
        <Row label="Confirm before deleting chats" desc="Show confirmation dialog"><Switch checked={settings.confirm_delete} onChange={v=> update({confirm_delete:v})} /></Row>
      </Section>
    </div>
  );
  const renderAppearance = () => (
    <div className="space-y-4">
      <Section title="Appearance" desc="Theme, density and typography">
        <div className="py-4 border-b" style={{borderColor:"var(--border)"}}>
          <div className="text-sm" style={{color:"var(--text)"}}>Theme</div>
          <div className="flex gap-2 mt-2">
            {["dark","light","system"].map(t=> (
              <button key={t} onClick={()=> update({theme:t})} className={`px-4 py-2 rounded-full text-xs border capitalize ${settings.theme===t ? "bg-[var(--text)] text-[var(--bg)] border-transparent" : "bg-transparent"}`} style={settings.theme!==t?{borderColor:"var(--border)", color:"var(--text)"}:undefined}>{t}</button>
            ))}
          </div>
        </div>
        <Row label="Chat density" desc="Comfortable is spacious, Compact shows more"><Select value={settings.chat_density} onChange={v=> update({chat_density:v})} options={[{label:"Comfortable",value:"comfortable"},{label:"Compact",value:"compact"}]} /></Row>
        <Row label="Animations" desc="Subtle transitions"><Switch checked={settings.animations} onChange={v=> update({animations:v})} /></Row>
        <Row label="Reduce motion" desc="Respect prefers-reduced-motion"><Switch checked={settings.reduce_motion} onChange={v=> update({reduce_motion:v})} /></Row>
        <div className="py-4">
          <div className="text-sm" style={{color:"var(--text)"}}>Font size</div>
          <div className="flex gap-2 mt-2">
            {["small","medium","large"].map(s=> (
              <button key={s} onClick={()=> update({font_size:s})} className={`px-4 py-2 rounded-full text-xs border capitalize ${settings.font_size===s ? "bg-[var(--text)] text-[var(--bg)] border-transparent" : ""}`} style={settings.font_size!==s?{borderColor:"var(--border)", color:"var(--text)"}:undefined}>{s}</button>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
  const renderVoice = () => (
    <div className="space-y-4">
      <Section title="Voice" desc="Speech synthesis and microphone">
        <Row label="Enable voice responses" desc="Allow VISION to speak answers"><Switch checked={settings.voice_enabled} onChange={v=> update({voice_enabled:v})} /></Row>
        <Row label="Voice" desc={settings.voice_enabled ? "Choose synthesis voice" : "Voice is currently unavailable."}>
          <Select value={settings.voice_id} onChange={v=> update({voice_id:v})} options={[{label:"VISION Male",value:"vision-male"},{label:"VISION Female",value:"vision-female"},{label:"System Default",value:"system"}]} />
        </Row>
        <Row label="Speech speed">
          <Select value={settings.speech_speed} onChange={v=> update({speech_speed:v})} options={["0.75x","1x","1.25x","1.5x","2x"].map(x=>({label:x,value:x}))} />
        </Row>
        <Row label="Auto-play responses" desc="Speak after generation"><Switch checked={settings.autoplay_voice} onChange={v=> update({autoplay_voice:v})} /></Row>
        <div className="pt-4 flex gap-2">
          <button onClick={handleTestVoice} className="px-5 py-2 rounded-full text-sm border" style={{borderColor:"var(--border)", color:"var(--text)"}}>▶ Test Voice</button>
          {testRes?.success && <span className="text-xs self-center" style={{color:"var(--success)"}}>Playing ✓</span>}
          {testRes?.error && <span className="text-xs self-center text-red-400">{testRes.error}</span>}
        </div>
        <div className="pt-3 text-xs" style={{color:"var(--muted)"}}>Microphone input uses browser default device. On HTTPS/localhost only.</div>
      </Section>
    </div>
  );
  const vm = health?.visionModel || aiCfg?.health?.visionModel || {};
  const visionName = vm?.name || aiCfg?.vision_model || "";
  const visionInstalled = vm?.installed;
  const visionCapable = vm?.capable;
  const visionConfigured = vm?.configured ?? !!visionName;
  const ollamaConnected = health?.ollama?.connected ?? true;
  const renderAI = () => (
    <div className="space-y-4">
      <Section title="AI & Models" desc="Model selection and generation">
        <Row label="Chat Model"><span className="text-xs font-mono px-3 py-1.5 rounded-full border" style={{borderColor:"var(--border)", color:"var(--muted)"}}>{health?.textModel?.name || aiCfg?.text_model || aiCfg?.model || "llama3"}</span></Row>
        <Row label="Code Model"><span className="text-xs font-mono px-3 py-1.5 rounded-full border" style={{borderColor:"var(--border)", color:"var(--muted)"}}>{aiCfg?.code_model || health?.textModel?.name || "—"}</span></Row>
        <Row label="Vision Model" desc={visionConfigured ? (visionInstalled ? (visionCapable ? "● Ready" : "⚠ Not vision-capable") : "⚠ Not installed — ollama pull "+visionName) : "○ Unavailable — Set OLLAMA_VISION_MODEL"}>
          <span className="text-xs font-mono">{visionName || "—"}</span>
        </Row>
        <Row label="Reasoning Model"><span className="text-xs font-mono" style={{color:"var(--muted)"}}>{aiCfg?.think_model || "—"}</span></Row>
        <Row label="Agent Model"><span className="text-xs font-mono" style={{color:"var(--muted)"}}>{aiCfg?.agent_model || "—"}</span></Row>
        <Row label="Temperature" desc={`Controls creativity (${settings.temperature})`}>
          <input type="range" min={0} max={1} step={0.1} value={settings.temperature} onChange={e=> update({temperature: parseFloat(e.target.value)})} className="w-32" />
        </Row>
        <Row label="Context length" desc="Max tokens for conversation context">
          <Select value={String(settings.context_length)} onChange={v=> update({context_length: parseInt(v)})} options={[{label:"2048",value:"2048"},{label:"4096",value:"4096"},{label:"8192",value:"8192"},{label:"16384",value:"16384"}]} />
        </Row>
        <Row label="Streaming" desc="Stream tokens as they generate"><Switch checked={settings.streaming} onChange={v=> update({streaming:v})} /></Row>
        <Row label="Show generation status" desc="Display 'Thinking...' and progress"><Switch checked={settings.show_generation_status} onChange={v=> update({show_generation_status:v})} /></Row>
      </Section>
      <Section title="Local AI — Ollama" desc="On-device inference status">
        <div className="divide-y" style={{borderColor:"var(--border)"}}>
          <div className="flex justify-between py-3">
            <span className="text-sm" style={{color:"var(--muted)"}}>Status</span>
            <span className={`text-sm ${ollamaConnected ? "text-emerald-400" : "text-red-400"}`}>{ollamaConnected ? "● Connected" : "○ Disconnected"}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-sm" style={{color:"var(--muted)"}}>Server</span>
            <span className="text-xs font-mono" style={{color:"var(--text)"}}>{health?.ollama?.baseUrl || aiCfg?.ollama_url || "http://localhost:11434"}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-sm" style={{color:"var(--muted)"}}>Text model</span>
            <span className="text-xs font-mono" style={{color: health?.textModel?.installed ? "var(--success)" : "var(--muted)"}}>{health?.textModel?.installed ? "● Installed" : "○ Not installed"}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={()=>{
            fetch(apiUrl("/api/ai/health/")).then(r=>r.json()).then(setHealth).catch(()=>{});
            fetch(apiUrl("/api/ai/settings/"),{headers: localStorage.getItem("accessToken")?{Authorization:`Bearer ${localStorage.getItem("accessToken")}`}:undefined}).then(r=>r.json()).then(setAiCfg).catch(()=>{});
          }} className="px-4 py-2 rounded-full text-xs border" style={{borderColor:"var(--border)", color:"var(--text)"}}>Refresh Models</button>
          <button onClick={async()=>{
            setTesting(true); setTestRes(null);
            try{
              const t=localStorage.getItem("accessToken");
              const r=await fetch(apiUrl("/api/ai/vision/test/"),{method:"POST", headers: t?{Authorization:`Bearer ${t}`}:{}});
              const j=await r.json(); setTestRes(j);
            }catch(e:any){ setTestRes({success:false, error:String(e)}); }
            setTesting(false);
          }} disabled={testing} className="px-4 py-2 rounded-full text-xs border disabled:opacity-50" style={{borderColor:"var(--border)", color:"var(--text)"}}>{testing?"Testing...":"Test Connection"}</button>
        </div>
        {testRes && <div className={`mt-3 text-xs rounded-xl px-3 py-2 border ${testRes.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>{testRes.success ? "✓ Vision model is working" : `✗ ${testRes.error}`}</div>}
        {!ollamaConnected && <div className="mt-3 flex gap-2"><button onClick={()=> window.location.reload()} className="px-4 py-2 rounded-full text-xs" style={{background:"var(--text)", color:"var(--bg)"}}>Retry Connection</button></div>}
      </Section>
    </div>
  );
  const renderPerformance = () => (
    <div className="space-y-4">
      <Section title="Performance" desc="Latency and resource usage — changes apply to next message">
        <Row label="Fast response mode" desc="Use smaller model for quick answers"><Switch checked={settings.fast_mode} onChange={v=> update({fast_mode:v})} /></Row>
        <Row label="Use model routing" desc="Automatically select best model per task"><Switch checked={settings.use_routing} onChange={v=> update({use_routing:v})} /></Row>
        <Row label="Keep model warm" desc="Keeping the model warm can reduce response startup time but may use more memory."><Switch checked={settings.keep_warm} onChange={v=> update({keep_warm:v})} /></Row>
        <Row label="Maximum generation tokens" desc={`${settings.max_tokens} tokens — applies to next message`}>
          <input type="range" min={256} max={4096} step={256} value={settings.max_tokens} onChange={e=> update({max_tokens: parseInt(e.target.value)})} className="w-32" />
        </Row>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border p-3" style={{background:"var(--bg)", borderColor:"var(--border)"}}><div className="text-xs" style={{color:"var(--muted)"}}>Avg Latency</div><div className="text-sm font-mono">{usage?.average_latency_ms ?? perf?.latency?.average_response_ms ?? "—"} ms</div></div>
          <div className="rounded-xl border p-3" style={{background:"var(--bg)", borderColor:"var(--border)"}}><div className="text-xs" style={{color:"var(--muted)"}}>Avg TTFT</div><div className="text-sm font-mono">{usage?.average_ttft_ms ?? perf?.latency?.average_ttft_ms ?? "—"} ms</div></div>
          <div className="rounded-xl border p-3" style={{background:"var(--bg)", borderColor:"var(--border)"}}><div className="text-xs" style={{color:"var(--muted)"}}>Model Loaded</div><div className="text-xs">{perf?.ollama?.model_loaded ? "● In VRAM" : "○ Cold"}</div></div>
        </div>
      </Section>
    </div>
  );
  const renderPrivacy = () => (
    <div className="space-y-4">
      <Section title="Privacy" desc="Control what VISION stores and uses">
        <Row label="Chat History" desc="Save conversations to your account"><Switch checked={settings.chat_history_enabled} onChange={v=> update({chat_history_enabled:v})} /></Row>
        <Row label="Memory" desc="Memory allows VISION to remember useful information across conversations."><Switch checked={settings.memory_enabled} onChange={v=> update({memory_enabled:v})} /></Row>
        <Row label="Save uploaded files" desc="Keep images/files attached to chats"><Switch checked={settings.save_files} onChange={v=> update({save_files:v})} /></Row>
        <Row label="Use conversation history for context" desc="Include recent messages when generating"><Switch checked={settings.use_history_context} onChange={v=> update({use_history_context:v})} /></Row>
        <Row label="Analytics" desc="Anonymous usage metrics"><Switch checked={settings.analytics} onChange={v=> update({analytics:v})} /></Row>
        <Row label="Personalization" desc="Tailor responses to your preferences"><Switch checked={settings.personalization} onChange={v=> update({personalization:v})} /></Row>
      </Section>
    </div>
  );
  const renderMemory = () => {
    if (!isAuthenticated) return (
      <Section title="Memory" desc="Manage what VISION remembers about you.">
        <div className="py-8 text-center">
          <div className="text-sm" style={{color:"var(--muted)"}}>Sign in to manage memory</div>
          <Link href="/login" className="inline-block mt-3 px-5 py-2 rounded-full text-sm" style={{background:"var(--text)", color:"var(--bg)"}}>Log in</Link>
        </div>
      </Section>
    );
    return (
    <div className="space-y-4">
      <Section title="Memory" desc="Manage what VISION remembers about you.">
        <div className="flex gap-2">
          <input value={newMem} onChange={e=> setNewMem(e.target.value)} placeholder="e.g., Preferred language is Python" className="flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={{background:"var(--bg)", border:"1px solid var(--border)", color:"var(--text)"}} />
          <select value={newCat} onChange={e=> setNewCat(e.target.value)} className="rounded-xl px-3 py-2 text-sm border" style={{background:"var(--bg)", borderColor:"var(--border)", color:"var(--text)"}}>
            <option value="fact">Fact</option><option value="preference">Preference</option><option value="project">Project</option><option value="instruction">Instruction</option>
          </select>
          <button onClick={async()=>{
            if(!newMem.trim()) return;
            try{ const m = await createMemory(newMem.trim(), newCat); setMemories(prev=>[m,...prev]); setNewMem(""); }
            catch(e:any){ alert(e.message); }
          }} className="px-4 py-2 rounded-full text-xs font-medium" style={{background:"var(--text)", color:"var(--bg)"}}>+ Add</button>
        </div>
        {memLoading ? <div className="text-xs py-6 text-center" style={{color:"var(--muted)"}}>Loading...</div> :
         memories.length===0 ? <div className="text-xs py-6 text-center" style={{color:"var(--muted)"}}>No memories yet. VISION will remember important details automatically.</div> :
         <div className="mt-4 divide-y" style={{borderColor:"var(--border)"}}>
           {memories.map(m=> (
             <div key={m.id} className="flex justify-between gap-3 py-3">
               <div className="min-w-0">
                 <div className="text-sm" style={{color:"var(--text)"}}>{m.content}</div>
                 <div className="text-xs mt-1 flex gap-2" style={{color:"var(--muted)"}}><span className="px-2 py-0.5 rounded-full border text-[10px]" style={{borderColor:"var(--border)"}}>{m.category}</span>{m.is_pinned && <span className="text-emerald-400">● Pinned</span>}</div>
               </div>
               <div className="flex items-center gap-1 shrink-0">
                 <button onClick={async()=>{ try{ await togglePin(m.id, !m.is_pinned); setMemories(prev=> prev.map(x=> x.id===m.id?{...x, is_pinned:!x.is_pinned}:x)); }catch{}}} className="px-2 py-1 rounded-full text-xs border" style={{borderColor:"var(--border)", color:"var(--muted)"}}>{m.is_pinned?"Unpin":"Pin"}</button>
                 <button onClick={async()=>{ if(!confirm("Delete this memory?")) return; await deleteMemory(m.id); setMemories(prev=> prev.filter(x=> x.id!==m.id)); }} className="px-2 py-1 rounded-full text-xs border" style={{borderColor:"var(--border)", color:"var(--muted)"}}>Delete</button>
               </div>
             </div>
           ))}
         </div>
        }
        {memories.length>0 && <button onClick={async()=>{ if(!confirm("Are you sure you want to delete all saved memories?")) return; await clearMemories(); setMemories([]); }} className="mt-4 w-full rounded-full py-2 text-xs border" style={{borderColor:"rgba(255,60,60,0.3)", color:"#ff5c5c"}}>Clear All Memory</button>}
      </Section>
    </div>
  ); };
  const renderNotifications = () => (
    <div className="space-y-4">
      <Section title="Notifications" desc="In-app and system notifications">
        <Row label="AI response completed"><Switch checked={settings.notif_ai_complete} onChange={v=> update({notif_ai_complete:v})} /></Row>
        <Row label="Agent completed"><Switch checked={settings.notif_agent_complete} onChange={v=> update({notif_agent_complete:v})} /></Row>
        <Row label="Project build completed"><Switch checked={settings.notif_build_complete} onChange={v=> update({notif_build_complete:v})} /></Row>
        <Row label="Research completed"><Switch checked={settings.notif_research_complete} onChange={v=> update({notif_research_complete:v})} /></Row>
        <Row label="System notifications"><Switch checked={settings.notif_system} onChange={v=> update({notif_system:v})} /></Row>
        <Row label="Email notifications"><Switch checked={settings.notif_email} onChange={v=> update({notif_email:v})} /></Row>
        <div className="pt-4 space-y-3">
          <div className="text-xs font-medium" style={{color:"var(--text)"}}>Browser & Push Notifications</div>
          {notifPerm==="denied" && <div className="rounded-xl border px-4 py-3 text-xs" style={{background:"var(--bg)", borderColor:"var(--border)", color:"var(--muted)"}}>Notifications are blocked by your browser. Open browser settings to enable them.</div>}
          {notifPerm==="granted" && <div className="text-xs flex items-center gap-2" style={{color:"var(--success)"}}>● Notifications enabled <button onClick={async()=>{ const { showLocalNotification } = await import("@/lib/push"); await showLocalNotification("VISION","Test notification — you're all set!");}} className="ml-2 px-3 py-1 rounded-full border text-xs" style={{borderColor:"var(--border)", color:"var(--text)"}}>Send test</button> <button onClick={async()=>{ const { unsubscribePush } = await import("@/lib/push"); await unsubscribePush(); setNotifPerm(Notification.permission);}} className="px-3 py-1 rounded-full border text-xs" style={{borderColor:"var(--border)", color:"var(--muted)"}}>Disable</button></div>}
          {notifPerm==="default" && <button onClick={async()=>{ try{ const p=await Notification.requestPermission(); setNotifPerm(p); if(p==="granted"){ const { subscribePush } = await import("@/lib/push"); await subscribePush(); } }catch{}}} className="px-4 py-2 rounded-full text-xs border" style={{borderColor:"var(--border)", color:"var(--text)"}}>Enable Notifications</button>}
          <div className="text-xs" style={{color:"var(--muted)"}}>VISION will ask once. We never spam — only AI task completions, long-running generations, or important account updates. You can disable anytime here or in browser settings.</div>
        </div>
      </Section>
    </div>
  );
  const renderData = () => {
    if (!isAuthenticated) return (
      <Section title="Storage" desc="Local storage usage">
        <div className="py-8 text-center">
          <div className="text-sm" style={{color:"var(--muted)"}}>Sign in to view your data</div>
          <Link href="/login" className="inline-block mt-3 px-5 py-2 rounded-full text-sm" style={{background:"var(--text)", color:"var(--bg)"}}>Log in</Link>
        </div>
      </Section>
    );
    return (
    <div className="space-y-4">
      <Section title="Storage" desc="Local storage usage">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border p-3 text-center" style={{background:"var(--bg)", borderColor:"var(--border)"}}><div className="text-lg font-mono">{stats?.conversations ?? "—"}</div><div className="text-xs" style={{color:"var(--muted)"}}>Conversations</div></div>
          <div className="rounded-xl border p-3 text-center" style={{background:"var(--bg)", borderColor:"var(--border)"}}><div className="text-lg font-mono">{stats?.files ?? "—"}</div><div className="text-xs" style={{color:"var(--muted)"}}>Files</div></div>
          <div className="rounded-xl border p-3 text-center" style={{background:"var(--bg)", borderColor:"var(--border)"}}><div className="text-lg font-mono">{stats?.memory_items ?? memories.length ?? "—"}</div><div className="text-xs" style={{color:"var(--muted)"}}>Memory</div></div>
        </div>
        <div className="flex justify-between py-3 mt-2 border-t" style={{borderColor:"var(--border)"}}>
          <span className="text-sm" style={{color:"var(--muted)"}}>Storage used</span>
          <span className="text-sm font-mono" style={{color:"var(--text)"}}>{stats ? `${stats.storage_mb} MB` : "—"}</span>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleExport} className="flex-1 py-2.5 rounded-full text-sm border" style={{borderColor:"var(--border)", color:"var(--text)"}}>Export Data</button>
          <button onClick={async()=>{
            const blob = new Blob([JSON.stringify({conversations: stats, exported_at: new Date().toISOString()},null,2)],{type:"application/json"});
            const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`vision-conversations-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
          }} className="flex-1 py-2.5 rounded-full text-sm border" style={{borderColor:"var(--border)", color:"var(--text)"}}>Download Conversations</button>
        </div>
      </Section>
      <Section title="Chat History Management">
        <div className="space-y-2">
          <button onClick={async()=>{
            if(!confirm("Delete all conversations?\nThis action cannot be undone.")) return;
            const t=localStorage.getItem("accessToken");
            const res=await fetch(apiUrl("/api/auth/data/clear-history/"),{method:"POST", headers: t?{Authorization:`Bearer ${t}`}:{}});
            if(res.ok){ alert("Deleted"); setStats((s:any)=> ({...s, conversations:0})); } else alert("Failed");
          }} className="w-full py-2.5 rounded-full text-sm border" style={{borderColor:"rgba(255,60,60,0.25)", color:"#ff5c5c"}}>Delete all chats</button>
          <button onClick={async()=>{ if(!confirm("Clear all memories? This will delete every saved memory.")) return; await clearMemories(); setMemories([]); }} className="w-full py-2.5 rounded-full text-sm border" style={{borderColor:"rgba(255,60,60,0.25)", color:"#ff5c5c"}}>Clear Memory</button>
        </div>
      </Section>
      <Section title="Danger Zone">
        <div className="rounded-xl border p-4" style={{borderColor:"rgba(255,60,60,0.3)", background:"rgba(255,60,60,0.05)"}}>
          <div className="text-sm font-medium" style={{color:"#ff5c5c"}}>Destructive actions</div>
          <div className="text-xs mt-1" style={{color:"var(--muted)"}}>These actions cannot be undone. Please proceed with caution.</div>
          <div className="mt-4 space-y-2">
            <button onClick={async()=>{
              const pwd = prompt("Enter your password to delete all conversations:");
              if(!pwd) return;
              if(!confirm("Final confirmation: delete EVERY conversation?")) return;
              const t=localStorage.getItem("accessToken");
              const res=await fetch(apiUrl("/api/auth/data/clear-history/"),{method:"POST", headers: t?{Authorization:`Bearer ${t}`}:{}});
              if(res.ok) alert("Cleared");
            }} className="w-full py-2 rounded-full text-xs border" style={{borderColor:"rgba(255,60,60,0.3)", color:"#ff5c5c"}}>Delete all conversations</button>
            <button onClick={async()=>{
              const pwd = prompt("Type DELETE and enter password to delete account:\nFormat: DELETE:password");
              if(!pwd) return;
              const [conf, pass] = pwd.split(":");
              const t=localStorage.getItem("accessToken");
              const res=await fetch(apiUrl("/api/auth/delete-account/"),{method:"POST", headers:{ "Content-Type":"application/json", ...(t?{Authorization:`Bearer ${t}`}:{})}, body: JSON.stringify({confirm:conf||"", password:pass||""})});
              const j=await res.json().catch(()=>({detail:"Failed"}));
              if(res.ok){ alert("Account deleted"); localStorage.clear(); window.location.href="/"; } else alert(j.detail || "Failed");
            }} className="w-full py-2 rounded-full text-xs" style={{background:"#ff3b30", color:"white"}}>Delete account</button>
          </div>
        </div>
      </Section>
    </div>
  ); };
  const renderSecurity = () => {
    if (!isAuthenticated) return (
      <Section title="Security" desc="Password and sessions">
        <div className="py-8 text-center">
          <div className="text-sm" style={{color:"var(--muted)"}}>Sign in to manage security</div>
          <Link href="/login" className="inline-block mt-3 px-5 py-2 rounded-full text-sm" style={{background:"var(--text)", color:"var(--bg)"}}>Log in</Link>
        </div>
      </Section>
    );
    return (
    <div className="space-y-4">
      <Section title="Security" desc="Password and sessions">
        <div className="space-y-3">
          <input type="password" placeholder="Current password" value={pwd.cur} onChange={e=> setPwd({...pwd, cur:e.target.value})} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{background:"var(--bg)", border:"1px solid var(--border)", color:"var(--text)"}} />
          <input type="password" placeholder="New password (min 8 chars)" value={pwd.nw} onChange={e=> setPwd({...pwd, nw:e.target.value})} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{background:"var(--bg)", border:"1px solid var(--border)", color:"var(--text)"}} />
          <input type="password" placeholder="Confirm new password" value={pwd.conf} onChange={e=> setPwd({...pwd, conf:e.target.value})} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{background:"var(--bg)", border:"1px solid var(--border)", color:"var(--text)"}} />
          <button onClick={async()=>{
            setPwdMsg(null);
            try{
              const t=localStorage.getItem("accessToken");
              const res=await fetch(apiUrl("/api/auth/change-password/"),{method:"POST", headers:{ "Content-Type":"application/json", ...(t?{Authorization:`Bearer ${t}`}:{})}, body: JSON.stringify({current_password: pwd.cur, new_password: pwd.nw, confirm_password: pwd.conf})});
              const j=await res.json().catch(()=>({}));
              if(!res.ok) throw new Error(j.detail || "Failed");
              setPwdMsg("Password changed ✓"); setPwd({cur:"",nw:"",conf:""});
            }catch(e:any){ setPwdMsg(e.message); }
          }} className="w-full py-2.5 rounded-full text-sm font-medium" style={{background:"var(--text)", color:"var(--bg)"}}>Change password</button>
          {pwdMsg && <div className={`text-xs rounded-xl px-3 py-2 border ${pwdMsg.includes("✓") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>{pwdMsg}</div>}
        </div>
        <div className="pt-4 border-t mt-4" style={{borderColor:"var(--border)"}}>
          <div className="text-sm" style={{color:"var(--text)"}}>Active session</div>
          <div className="text-xs mt-1" style={{color:"var(--muted)"}}>Current device • {new Date().toLocaleDateString()}</div>
          <button onClick={()=> { if(confirm("Sign out all devices?")) { logout(); router.push("/"); } }} className="mt-3 px-4 py-2 rounded-full text-xs border" style={{borderColor:"var(--border)", color:"var(--text)"}}>Sign out all devices</button>
        </div>
      </Section>
    </div>
  ); };
  const renderAbout = () => (
    <div className="space-y-4">
      <Section title="About VISION" desc="Your personal AI assistant.">
        <VersionInfo />
        <div className="divide-y mt-4" style={{borderColor:"var(--border)"}}>
          <div className="flex justify-between py-3"><span className="text-sm" style={{color:"var(--muted)"}}>Local AI</span><span className="text-sm" style={{color:"var(--text)"}}>Ollama • {aiCfg?.ollama_url || health?.ollama?.baseUrl || "localhost:11434"}</span></div>
          <div className="flex justify-between py-3"><span className="text-sm" style={{color:"var(--muted)"}}>Environment</span><span className="text-sm" style={{color:"var(--text)"}}>{aiCfg?.local_only ? "Local only" : "Hybrid"}</span></div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <a href="https://github.com" target="_blank" rel="noopener" className="px-4 py-2 rounded-full text-xs border" style={{borderColor:"var(--border)", color:"var(--text)"}}>Documentation</a>
          <a href="#" className="px-4 py-2 rounded-full text-xs border" style={{borderColor:"var(--border)", color:"var(--text)"}}>Privacy</a>
          <a href="#" className="px-4 py-2 rounded-full text-xs border" style={{borderColor:"var(--border)", color:"var(--text)"}}>Terms</a>
        </div>
      </Section>
    </div>
  );

  const renderActive = () => {
    switch(active){
      case "general": return renderGeneral();
      case "appearance": return renderAppearance();
      case "voice": return renderVoice();
      case "ai": return renderAI();
      case "performance": return renderPerformance();
      case "privacy": return renderPrivacy();
      case "memory": return renderMemory();
      case "notifications": return renderNotifications();
      case "data": return renderData();
      case "security": return renderSecurity();
      case "about": return renderAbout();
      default: return renderGeneral();
    }
  };

  // Mobile detail view
  if (mobileView) {
    const title = NAV.find(n=> n.id===mobileView)?.label || mobileView;
    return (
      <div className="min-h-screen flex flex-col" style={{background:"var(--bg)", color:"var(--text)", paddingTop: "env(safe-area-inset-top)"}}>
        <div className="h-14 flex items-center gap-3 px-4 border-b shrink-0" style={{borderColor:"var(--border)", paddingTop: "env(safe-area-inset-top)"}}>
          <button onClick={()=> setMobileView(null)} className="h-9 w-9 grid place-items-center rounded-full border text-sm shrink-0" style={{borderColor:"var(--border)", minWidth: "36px", minHeight: "36px"}} aria-label="Back to settings">←</button>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-[max(32px,env(safe-area-inset-bottom))] overscroll-contain">
          <div className="space-y-4">
            {mobileView==="general" && renderGeneral()}
            {mobileView==="appearance" && renderAppearance()}
            {mobileView==="voice" && renderVoice()}
            {mobileView==="ai" && renderAI()}
            {mobileView==="performance" && renderPerformance()}
            {mobileView==="privacy" && renderPrivacy()}
            {mobileView==="memory" && renderMemory()}
            {mobileView==="notifications" && renderNotifications()}
            {mobileView==="data" && renderData()}
            {mobileView==="security" && renderSecurity()}
            {mobileView==="about" && renderAbout()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{background:"var(--bg)", color:"var(--text)", paddingTop: "env(safe-area-inset-top)"}}>
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-4 md:px-6 border-b shrink-0" style={{borderColor:"var(--border)", background:"var(--bg)", paddingTop: "env(safe-area-inset-top)"}}>
        <div className="flex items-center gap-3">
          <Link href="/chat" className="h-8 w-8 grid place-items-center rounded-full border text-xs" style={{borderColor:"var(--border)"}}>←</Link>
          <span className="text-sm font-medium">Settings</span>
          {savedTick && <span className="text-xs px-2 py-1 rounded-full" style={{background:"var(--success)", color:"white"}}>Saved ✓</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex relative">
            <input value={query} onChange={e=> setQuery(e.target.value)} placeholder="Search settings..." className="w-56 rounded-full px-4 py-2 text-xs outline-none border" style={{background:"var(--surface)", borderColor:"var(--border)", color:"var(--text)"}} />
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[240px] flex-col border-r shrink-0 overflow-y-auto" style={{borderColor:"var(--border)", background:"var(--bg)"}}>
          <div className="p-3">
            <div className="px-3 pb-2">
              <VisionLogo size={22} showText={true} />
            </div>
            <div className="mt-4 space-y-1">
              {(filteredNav as any[]).map(n=> (
                <button key={n.id} onClick={()=> setActive(n.id)} className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${active===n.id ? "bg-[var(--text)] text-[var(--bg)]" : "hover:bg-[var(--surface)]"}`} style={active!==n.id?{color:"var(--text)"}:undefined}>
                  {n.label}
                </button>
              ))}
              {filteredNav.length===0 && <div className="text-xs px-3 py-4" style={{color:"var(--muted)"}}>No results for “{query}”</div>}
            </div>
          </div>
          <div className="mt-auto p-3 border-t" style={{borderColor:"var(--border)"}}>
            <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--surface)]">
              <span className="h-8 w-8 rounded-full grid place-items-center text-xs border" style={{background:"var(--surface)", borderColor:"var(--border)"}}>S</span>
              <span className="text-xs" style={{color:"var(--muted)"}}>Profile →</span>
            </Link>
            {!isAuthenticated && <div className="text-xs px-3 py-2" style={{color:"var(--muted)"}}>Sign in for full settings</div>}
          </div>
        </aside>

        {/* Mobile list */}
        <div className="md:hidden flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="relative mb-4">
              <input value={query} onChange={e=> setQuery(e.target.value)} placeholder="Search settings..." className="w-full rounded-xl px-4 py-3 text-sm outline-none border" style={{background:"var(--surface)", borderColor:"var(--border)", color:"var(--text)"}} />
            </div>
            <div className="rounded-2xl border overflow-hidden" style={{background:"var(--surface)", borderColor:"var(--border)"}}>
              {(filteredNav as any[]).map(n=> (
                <button key={n.id} onClick={()=> setMobileView(n.id)} className="w-full flex items-center justify-between px-4 py-4 text-sm border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5" style={{borderColor:"var(--border)", color:"var(--text)"}}>
                  <span>{n.label}</span><span style={{color:"var(--muted)"}}>›</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-xs" style={{color:"var(--muted)"}}>
              <Link href="/profile">Profile</Link>
              <Link href="/chat">Back to VISION</Link>
            </div>
          </div>
        </div>

        {/* Desktop content */}
        <div className="hidden md:flex flex-1 overflow-y-auto">
          <div className="w-full max-w-[720px] mx-auto px-6 py-8 pb-12 space-y-6">
            {/* inline search results highlight */}
            {renderActive()}
          </div>
        </div>
      </div>
    </div>
  );
}

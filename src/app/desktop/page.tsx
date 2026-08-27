"use client";
import AppShell from "@/components/AppShell";

export default function DesktopPage(){
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto p-6 md:p-8">
        <h1 className="text-2xl font-light">VISION Desktop Companion</h1>
        <p className="text-sm text-white/60 mt-2">Local AI operating layer — Phase 4 portfolio polish. No cloud, no Electron yet, but designed for it.</p>
        <div className="mt-6 grid gap-6">
          <div className="glass rounded-2xl p-6 border border-white/10">
            <h3 className="text-sm font-medium">What “Desktop Companion” means</h3>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              VISION is architected as a local OS layer: per-user sandboxed workspace at <span className="font-mono text-white">backend/workspace/&lt;user_id&gt;/</span>, tool allowlists, and approval gates. A future Electron/Tauri wrapper would expose:
            </p>
            <ul className="mt-3 text-sm text-white/60 list-disc list-inside space-y-1">
              <li>Global hotkey (e.g., ⌘+Shift+V) → VISION overlay</li>
              <li>Menubar tray — local model status, RAM/VRAM, queue</li>
              <li>Native file picker & screen capture (already via getDisplayMedia)</li>
              <li>Offline-first — works without internet, sync optional</li>
            </ul>
          </div>
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-medium">Current local-first guarantees (Phase 4)</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3"><div className="text-emerald-300">● Local inference</div><div className="text-white/50 mt-1">Ollama llama3 + moondream, no external API</div></div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3"><div className="text-emerald-300">● Local storage</div><div className="text-white/50 mt-1">Postgres + workspace per-user, no cloud sync</div></div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3"><div className="text-emerald-300">● Local vision</div><div className="text-white/50 mt-1">Images processed by moondream locally</div></div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3"><div className="text-emerald-300">● No sharing</div><div className="text-white/50 mt-1">No data leaves device (web_search mock fallback)</div></div>
            </div>
            <div className="mt-4 flex gap-2">
              <a href="/settings" className="px-4 py-2 rounded-full bg-white text-black text-sm">Open Privacy Settings</a>
              <a href="/chat" className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">Back to Chat</a>
            </div>
          </div>
          <div className="glass rounded-2xl p-6 border border-white/10">
            <h3 className="text-sm font-medium">How to run as “desktop” today</h3>
            <pre className="mt-3 bg-black rounded-xl p-4 text-xs font-mono overflow-auto">docker compose up -d   # pgvector + redis + ollama
python backend/env/Scripts/python backend/manage.py runserver 0.0.0.0:8000
cd frontend && npm run dev   # http://127.0.0.1:3000
# Workspace: backend/workspace/&lt;user_id&gt;/
# Models: ollama list (llama3, moondream, nomic-embed-text)</pre>
            <div className="text-xs text-white/40 mt-2">Future: <span className="font-mono">npm run desktop</span> with Tauri would wrap the same Next.js + Django stack.</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

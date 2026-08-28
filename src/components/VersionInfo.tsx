"use client";
import { useState } from "react";
import { APP_VERSION, APP_BUILD } from "@/lib/version";
import { useAppUpdate } from "@/hooks/useAppUpdate";

export default function VersionInfo() {
  const { latestVersion, updateAvailable, checking, error, checkForUpdates, applyUpdate } = useAppUpdate();
  const [msg, setMsg] = useState<string | null>(null);

  const handleCheck = async () => {
    setMsg(null);
    const latest = await checkForUpdates(true);
    if (!latest) {
      setMsg(error || "Unable to check for updates.");
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    if (updateAvailable || (latest && latest.version !== APP_VERSION)) {
      setMsg(`Update available: ${latest.version}`);
    } else {
      setMsg("You're using the latest version.");
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl grid place-items-center font-bold" style={{ background: "var(--text)", color: "var(--bg)" }}>V</div>
        <div>
          <div className="text-sm font-medium">VISION</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>Version {APP_VERSION} • Build {APP_BUILD}</div>
          <div className="text-[11px] tracking-wide" style={{ color: "var(--muted)" }}>Your personal AI assistant</div>
        </div>
      </div>
      <div className="pt-2 space-y-1">
        <div className="text-xs" style={{ color: "var(--muted)" }}>Created by <span className="font-medium" style={{color:"var(--text)"}}>Shlok Patel</span></div>
        <div className="text-[11px] tracking-widest" style={{ color: "var(--muted)", opacity:0.7 }}>shlokk.patel</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCheck}
          disabled={checking}
          className="px-4 py-2 rounded-full text-xs border disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          {checking ? "Checking..." : "Check for updates"}
        </button>
        {updateAvailable && (
          <button onClick={applyUpdate} className="px-4 py-2 rounded-full text-xs font-medium" style={{ background: "var(--text)", color: "var(--bg)" }}>
            Update now{latestVersion ? ` → ${latestVersion}` : ""}
          </button>
        )}
      </div>

      {updateAvailable && <div className="text-xs px-3 py-2 rounded-xl border" style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)", color: "var(--success)" }}>Update available: {latestVersion}</div>}
      {!updateAvailable && msg && <div className="text-xs px-3 py-2 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", color: msg.includes("Unable") ? "#ff5c5c" : "var(--muted)" }}>{msg}</div>}
      {error && !msg && <div className="text-xs" style={{ color: "var(--muted)" }}>{error}</div>}
    </div>
  );
}

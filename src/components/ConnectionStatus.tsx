"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type Status = "online" | "offline" | "connecting" | "unavailable";

export default function ConnectionStatus({ subtle = false }: { subtle?: boolean }) {
  const [status, setStatus] = useState<Status>("connecting");
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateOnline = () => setIsOffline(!navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    let alive = true;
    const check = async () => {
      if (!navigator.onLine) { if (alive) setStatus("offline"); return; }
      try {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 4000);
        const r = await fetch(apiUrl("/api/ai/health/"), { signal: c.signal });
        clearTimeout(t);
        if (!alive) return;
        if (r.ok) setStatus("online");
        else setStatus("unavailable");
      } catch {
        if (alive) setStatus(navigator.onLine ? "unavailable" : "offline");
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => { alive = false; clearInterval(id); window.removeEventListener("online", updateOnline); window.removeEventListener("offline", updateOnline); };
  }, []);

  if (isOffline || status === "offline") {
    return <div className={`flex items-center gap-1.5 text-xs ${subtle ? "opacity-60" : ""}`}><span className="h-2 w-2 rounded-full bg-amber-400" /> Offline</div>;
  }
  if (status === "online") return <div className={`flex items-center gap-1.5 text-xs ${subtle ? "opacity-50" : "text-emerald-300"}`}><span className="h-2 w-2 rounded-full bg-emerald-400" /> VISION Online</div>;
  if (status === "connecting") return <div className="flex items-center gap-1.5 text-xs opacity-50"><span className="h-2 w-2 rounded-full bg-white/40 animate-pulse" /> Connecting…</div>;
  return <div className="flex items-center gap-1.5 text-xs text-white/40"><span className="h-2 w-2 rounded-full bg-red-400" /> AI unavailable</div>;
}

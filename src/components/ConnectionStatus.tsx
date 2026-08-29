"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type Status = "online" | "offline" | "connecting" | "unavailable" | "backend_up_ai_down";

export default function ConnectionStatus({ subtle = false }: { subtle?: boolean }) {
  const [status, setStatus] = useState<Status>("connecting");
  const [isOffline, setIsOffline] = useState(false);
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    const updateOnline = () => setIsOffline(!navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    let alive = true;
    let retryCount = 0;
    const check = async () => {
      if (!navigator.onLine) { if (alive) setStatus("offline"); return; }
      try {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 5000);
        // Check lightweight backend health first
        const r = await fetch(apiUrl("/health"), { signal: c.signal });
        if (!alive) { clearTimeout(t); return; }
        if (!r.ok) {
          // Backend down
          setStatus("unavailable");
          setDetail("Backend unavailable");
          clearTimeout(t);
          return;
        }
        // Backend is up, check AI specifically
        try {
          const c2 = new AbortController();
          const t2 = setTimeout(() => c2.abort(), 4000);
          const aiR = await fetch(apiUrl("/api/ai/health/"), { signal: c2.signal });
          clearTimeout(t2);
          if (!alive) return;
          if (aiR.ok) {
            setStatus("online");
            setDetail("");
            retryCount = 0;
          } else {
            setStatus("backend_up_ai_down");
            setDetail("Backend online • AI warming up");
          }
        } catch {
          if (alive) {
            // Backend is up but AI check failed = AI unavailable but backend reachable
            setStatus("backend_up_ai_down");
            setDetail("Backend online • AI unavailable");
          }
        }
        clearTimeout(t);
      } catch {
        if (alive) {
          // Exponential backoff display
          retryCount = Math.min(retryCount + 1, 5);
          setStatus(navigator.onLine ? "unavailable" : "offline");
          setDetail("");
        }
      }
    };
    check();
    // Intelligent retry: 30s when online, backoff when unavailable
    const getInterval = () => status === "unavailable" || status === "backend_up_ai_down" ? 15000 : 30000;
    let id: any = setInterval(check, 30000);
    // Also re-check on visibility
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", check);
    return () => { alive = false; clearInterval(id); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("online", check); window.removeEventListener("online", updateOnline); window.removeEventListener("offline", updateOnline); };
  }, [status]);

  if (isOffline || status === "offline") {
    return <div className={`flex items-center gap-1.5 text-xs ${subtle ? "opacity-60" : ""}`} title="No internet connection"><span className="h-2 w-2 rounded-full bg-amber-400" /> Offline</div>;
  }
  if (status === "online") return <div className={`flex items-center gap-1.5 text-xs ${subtle ? "opacity-50" : "text-emerald-300"}`} title="Backend and AI are available"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Backend Online<span className="hidden sm:inline"> • AI Ready</span></div>;
  if (status === "backend_up_ai_down") return <div className="flex items-center gap-1.5 text-xs text-amber-300" title={detail}><span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> {detail}</div>;
  if (status === "connecting") return <div className="flex items-center gap-1.5 text-xs opacity-50"><span className="h-2 w-2 rounded-full bg-white/40 animate-pulse" /> Connecting…</div>;
  return <div className="flex items-center gap-1.5 text-xs text-red-400" title="Backend is currently unreachable (may be waking up)"><span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" /> Backend unavailable</div>;
}

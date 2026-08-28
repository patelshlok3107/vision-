"use client";
import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if (location.protocol !== "https:" && !isLocal) return;
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // Periodically check for updates (every 60 min) and on visibility
        const doUpdate = () => reg.update().catch(() => {});
        const interval = setInterval(doUpdate, 60 * 60 * 1000);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") doUpdate();
        });
        window.addEventListener("focus", doUpdate);
        window.addEventListener("online", doUpdate);
        // Cleanup on unload
        window.addEventListener("beforeunload", () => clearInterval(interval));
      } catch (e) {
        console.warn("SW registration failed", e);
      }
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}

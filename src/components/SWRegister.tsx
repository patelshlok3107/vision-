"use client";
import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Only register on https or localhost
    const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if (location.protocol !== "https:" && !isLocal) return;
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // Check for updates
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (nw) nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              // new version available — auto skipWaiting could be triggered
            }
          });
        });
        // Periodically check
        setInterval(() => reg.update().catch(()=>{}), 60*60*1000);
      } catch (e) {
        console.warn("SW registration failed", e);
      }
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    // Keyboard-aware visualViewport handled elsewhere, but ensure --keyboard-height reset on unload
    const onOffline = () => {
      // could show toast, handled by ConnectionStatus
    };
    window.addEventListener("offline", onOffline);
    return () => window.removeEventListener("offline", onOffline);
  }, []);
  return null;
}

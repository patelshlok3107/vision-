"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { APP_VERSION, fetchLatestVersion, isNewerVersion } from "@/lib/version";

export type UpdateState = {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  checking: boolean;
  error: string | null;
  waitingWorker: ServiceWorker | null;
  isStandalone: boolean;
};

export function useAppUpdate() {
  const [state, setState] = useState<UpdateState>({
    currentVersion: APP_VERSION,
    latestVersion: null,
    updateAvailable: false,
    checking: false,
    error: null,
    waitingWorker: null,
    isStandalone: false,
  });
  const waitingRef = useRef<ServiceWorker | null>(null);

  const checkForUpdates = useCallback(async (showError = false) => {
    setState((s) => ({ ...s, checking: true, error: null }));
    try {
      const latest = await fetchLatestVersion();
      if (!latest) {
        if (showError) setState((s) => ({ ...s, checking: false, error: "Unable to check for updates." }));
        else setState((s) => ({ ...s, checking: false }));
        return null;
      }
      const newer = isNewerVersion(latest.version, APP_VERSION);
      setState((s) => ({ ...s, latestVersion: latest.version, updateAvailable: newer, checking: false, error: null }));
      return latest;
    } catch {
      setState((s) => ({ ...s, checking: false, error: "Unable to check for updates." }));
      return null;
    }
  }, []);

  const applyUpdate = useCallback(() => {
    const w = waitingRef.current || state.waitingWorker;
    if (w) {
      w.postMessage({ type: "SKIP_WAITING" });
      // Fallback reload after skipWaiting
      let reloaded = false;
      const doReload = () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      };
      // Listen for controller change
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("controllerchange", doReload, { once: true });
        setTimeout(doReload, 1500);
      } else {
        doReload();
      }
    } else {
      // No waiting worker — check version.json and reload if newer
      checkForUpdates().then((latest) => {
        if (latest && isNewerVersion(latest.version, APP_VERSION)) {
          window.location.reload();
        } else {
          // Force reload to get fresh assets
          window.location.reload();
        }
      });
    }
  }, [state.waitingWorker, checkForUpdates]);

  useEffect(() => {
    // Detect standalone
    try {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
      setState((s) => ({ ...s, isStandalone: standalone }));
    } catch {}

    // Initial check
    checkForUpdates();

    if (!("serviceWorker" in navigator)) return;

    let reg: ServiceWorkerRegistration | null = null;

    const handleUpdateFound = () => {
      if (!reg) return;
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener("statechange", () => {
        if (nw.state === "installed" && navigator.serviceWorker.controller) {
          waitingRef.current = nw;
          setState((s) => ({ ...s, waitingWorker: nw, updateAvailable: true }));
          // Also fetch version to show version number
          fetchLatestVersion().then((latest) => {
            if (latest) setState((s) => ({ ...s, latestVersion: latest.version }));
          });
        }
      });
    };

    const handleControllerChange = () => {
      // New worker activated — reload once
      // Avoid infinite loop: only if we triggered update
      if (waitingRef.current) {
        window.location.reload();
      }
    };

    navigator.serviceWorker.ready.then((r) => {
      reg = r;
      // If already waiting
      if (r.waiting) {
        waitingRef.current = r.waiting;
        setState((s) => ({ ...s, waitingWorker: r.waiting, updateAvailable: true }));
        fetchLatestVersion().then((latest) => {
          if (latest) setState((s) => ({ ...s, latestVersion: latest.version }));
        });
      }
      r.addEventListener("updatefound", handleUpdateFound);
    }).catch(() => {});

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Re-check when app becomes visible or online
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((r) => r.update().catch(() => {})).catch(() => {});
        }
      }
    };
    const onOnline = () => checkForUpdates();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onVisible);

    return () => {
      if (reg) reg.removeEventListener("updatefound", handleUpdateFound);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onVisible);
    };
  }, [checkForUpdates]);

  // Also detect version mismatch via version.json even without SW — check every 5 min per spec
  useEffect(() => {
    const interval = setInterval(() => checkForUpdates(), 5 * 60 * 1000); // 5 min
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  return { ...state, checkForUpdates, applyUpdate };
}

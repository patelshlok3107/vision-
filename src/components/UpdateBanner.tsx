"use client";
import { useEffect, useState } from "react";
import { useAppUpdate } from "@/hooks/useAppUpdate";

export default function UpdateBanner() {
  const { updateAvailable, latestVersion, currentVersion, waitingWorker, applyUpdate, checkForUpdates } = useAppUpdate();
  const [dismissed, setDismissed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Don't show while streaming — check if any chat is streaming via dom marker
  useEffect(() => {
    const check = () => {
      // Simple heuristic: if body has streaming indicator
      const streaming = document.querySelector("[data-streaming='true']");
      setIsGenerating(!!streaming);
    };
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);

  if (!updateAvailable || dismissed) return null;

  const handleLater = () => {
    setDismissed(true);
    // Re-show after 1 hour or next version check
    setTimeout(() => setDismissed(false), 60 * 60 * 1000);
  };

  const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-[60] animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{
        left: isMobile ? "12px" : "auto",
        right: isMobile ? "12px" : "24px",
        bottom: isMobile ? "calc(12px + env(safe-area-inset-bottom))" : "24px",
        maxWidth: isMobile ? "none" : "380px",
      }}
    >
      <div
        className="rounded-2xl border shadow-xl p-4 flex flex-col gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
      >
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full grid place-items-center shrink-0" style={{ background: "var(--text)", color: "var(--bg)" }}>
            ↑
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">New VISION update available</div>
            <div className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>
              {latestVersion ? `Version ${latestVersion} is ready (${currentVersion} → ${latestVersion}).` : "A new version is ready."}
              {waitingWorker ? " Tap Update to activate." : " Refresh to load the latest."}
            </div>
          </div>
          <button
            onClick={handleLater}
            aria-label="Dismiss update"
            className="h-7 w-7 grid place-items-center rounded-full text-xs shrink-0"
            style={{ color: "var(--muted)" }}
          >
            ×
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={applyUpdate}
            disabled={isGenerating}
            title={isGenerating ? "Wait for AI response to finish" : undefined}
            className="flex-1 rounded-full py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--text)", color: "var(--bg)" }}
          >
            Update now
          </button>
          <button
            onClick={handleLater}
            className="px-5 py-2.5 rounded-full text-sm border"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Later
          </button>
        </div>
        {isGenerating && <div className="text-[11px] text-center" style={{ color: "var(--muted)" }}>AI is generating — update will reload after it finishes.</div>}
      </div>
    </div>
  );
}

// Inline small banner for chat composer area (alternative if needed)
export function UpdateInlineBanner() {
  const { updateAvailable, latestVersion, applyUpdate } = useAppUpdate();
  const [dismissed, setDismissed] = useState(false);
  if (!updateAvailable || dismissed) return null;
  return (
    <div className="mx-auto w-full max-w-[760px] mb-2 rounded-xl border px-3 py-2 flex items-center justify-between gap-3 text-xs" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
      <span>↻ Update available{latestVersion ? ` — ${latestVersion}` : ""}</span>
      <div className="flex gap-2">
        <button onClick={applyUpdate} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "var(--text)", color: "var(--bg)" }}>Update</button>
        <button onClick={() => setDismissed(true)} className="px-2 py-1 rounded-full border text-xs" style={{ borderColor: "var(--border)" }}>Later</button>
      </div>
    </div>
  );
}

// Tiny header indicator — visible in browser even when floating banner is dismissed
export function UpdateHeaderIndicator() {
  const { updateAvailable, latestVersion, applyUpdate } = useAppUpdate();
  if (!updateAvailable) return null;
  return (
    <button
      onClick={applyUpdate}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border animate-fadeIn"
      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
      title={`Update to ${latestVersion || "latest"} now`}
    >
      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="hidden sm:inline">Update available</span>
      <span className="sm:hidden">↻</span>
      <span className="hidden md:inline opacity-60">• {latestVersion || "new"}</span>
    </button>
  );
}

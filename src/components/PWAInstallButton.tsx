"use client";
import { useState } from "react";
import { usePWA } from "@/hooks/usePWA";

export default function PWAInstallButton({ variant = "primary" }: { variant?: "primary" | "ghost" | "hero" }) {
  const { installed, isIOS, isStandalone, canInstall, promptInstall } = usePWA();
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (isStandalone || installed) return null;

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSHelp((v) => !v);
      return;
    }
    if (canInstall) {
      setBusy(true);
      const res = await promptInstall();
      setBusy(false);
      if (res === "accepted") setMsg("Installing…");
      else if (res === "dismissed") setMsg(null);
      else setMsg(null);
      return;
    }
    // No prompt available — show instructions
    setShowIOSHelp((v) => !v);
  };

  const isHero = variant === "hero";
  const btnCls = isHero
    ? "btn btn-solid"
    : variant === "ghost"
    ? "px-4 py-2 rounded-full border text-sm hover:bg-white/5"
    : "px-5 py-2.5 rounded-full text-sm font-medium transition";

  const style: any = isHero ? {} : variant === "ghost" ? { borderColor: "var(--border)", color: "var(--text)" } : { background: "var(--text)", color: "var(--bg)" };

  return (
    <div className="relative inline-flex flex-col items-center">
      <button onClick={handleClick} disabled={busy} className={btnCls} style={style} aria-label="Install VISION">
        {busy ? "Installing…" : "Install VISION"}
      </button>
      {msg && <span className="text-xs mt-1" style={{ color: "var(--muted)" }}>{msg}</span>}
      {showIOSHelp && (
        <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-[300px] rounded-2xl border shadow-xl p-4 text-xs leading-relaxed z-30 text-left" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
          {isIOS ? (
            <>
              <div className="font-medium">Install on iPhone/iPad</div>
              <ol className="mt-2 list-decimal list-inside space-y-1" style={{ color: "var(--muted)" }}>
                <li>Open in <span style={{ color: "var(--text)" }}>Safari</span></li>
                <li>Tap <span style={{ color: "var(--text)" }}>Share</span> (square with arrow)</li>
                <li>Tap <span style={{ color: "var(--text)" }}>Add to Home Screen</span></li>
              </ol>
            </>
          ) : (
            <>
              <div className="font-medium">Install VISION</div>
              <div className="mt-2" style={{ color: "var(--muted)" }}>
                Chrome/Edge: Look for the <span style={{ color: "var(--text)" }}>Install</span> icon in the address bar, or menu → <span style={{ color: "var(--text)" }}>Install VISION</span>.<br />
                Safari (macOS): File → Add to Dock.
              </div>
            </>
          )}
          <button onClick={() => setShowIOSHelp(false)} className="mt-3 text-xs underline" style={{ color: "var(--muted)" }}>Close</button>
        </div>
      )}
    </div>
  );
}

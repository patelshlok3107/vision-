"use client";
import { useEffect } from "react";

export default function MobileDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="mobile-drawer-overlay md:hidden" role="dialog" aria-modal="true">
      <div className="flex-1" onClick={onClose} aria-label="Close drawer" />
      <div className="mobile-drawer" style={{ background: "var(--sidebar-bg)" }}>
        {children}
      </div>
    </div>
  );
}

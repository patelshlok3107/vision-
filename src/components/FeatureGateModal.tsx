"use client";
import Link from "next/link";

export default function FeatureGateModal({ open, onClose, feature }: { open: boolean; onClose: () => void; feature?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl p-6 border shadow-xl" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
        <h3 className="text-base font-medium">Sign in to unlock this feature</h3>
        <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
          {feature ? `${feature} is available for signed-in users.` : "This feature requires an account."} Create a free VISION account to continue.
        </p>
        <div className="flex gap-3 mt-6">
          <Link onClick={onClose} href="/login" className="flex-1 text-center rounded-full py-2.5 text-sm font-medium" style={{ background: "var(--text)", color: "var(--bg)" }}>Log in</Link>
          <Link onClick={onClose} href="/register" className="flex-1 text-center rounded-full py-2.5 text-sm font-medium border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Create account</Link>
        </div>
        <button onClick={onClose} className="w-full mt-3 text-xs hover:underline" style={{ color: "var(--muted)" }}>Continue as guest</button>
      </div>
    </div>
  );
}

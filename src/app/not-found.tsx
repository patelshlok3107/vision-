import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center" style={{ background: "var(--bg)", color: "var(--text)", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="h-16 w-16 rounded-2xl grid place-items-center text-xl font-bold border mb-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>404</div>
      <h1 className="text-xl font-medium">Page not found</h1>
      <p className="text-sm mt-2 max-w-sm" style={{ color: "var(--muted)" }}>The page you’re looking for doesn’t exist or was moved. Check the URL or return to VISION.</p>
      <Link href="/chat" className="mt-6 px-6 py-3 rounded-full text-sm font-medium" style={{ background: "var(--text)", color: "var(--bg)" }}>Back to VISION</Link>
      <div className="mt-4 flex gap-4 text-xs" style={{ color: "var(--muted)" }}>
        <Link href="/profile" className="underline">Profile</Link>
        <Link href="/settings" className="underline">Settings</Link>
        <Link href="/" className="underline">Home</Link>
      </div>
    </div>
  );
}

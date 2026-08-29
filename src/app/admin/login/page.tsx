"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi, setAdminToken, getAdminToken } from "@/lib/admin";
import VisionLogo from "@/components/VisionLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAdminToken()) {
      adminApi.me().then(() => router.replace("/admin")).catch(() => {});
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminApi.login(username.trim(), password);
      if (res.token) {
        setAdminToken(res.token);
        router.replace("/admin");
      } else throw new Error("No token returned");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[100dvh] grid place-items-center p-4" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="w-full max-w-[420px] rounded-2xl border p-8 shadow-xl" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex flex-col items-center text-center">
          <div className="h-10 w-10 rounded-xl grid place-items-center font-bold" style={{ background: "var(--text)", color: "var(--bg)" }}>V</div>
          <h1 className="text-xl font-medium mt-4">VISION Admin</h1>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Secure administrator access</p>
        </div>
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div>
            <label className="text-xs" style={{ color: "var(--muted)" }}>Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin" className="mt-1 w-full rounded-xl px-4 py-3 text-sm outline-none border" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} required />
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--muted)" }}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full rounded-xl px-4 py-3 text-sm outline-none border" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} required />
          </div>
          {error && <div className="rounded-xl px-3 py-2 text-xs border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#f87171" }}>{error}</div>}
          <button type="submit" disabled={loading} className="w-full rounded-full py-3 text-sm font-medium disabled:opacity-50" style={{ background: "var(--text)", color: "var(--bg)" }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <a href="/" className="text-xs underline" style={{ color: "var(--muted)" }}>← Back to VISION</a>
        </div>
        <div className="mt-4 text-[11px] text-center" style={{ color: "var(--muted)", opacity: 0.6 }}>Dev: admin / admin123 — production requires ADMIN_PASSWORD_HASH env</div>
      </div>
    </div>
  );
}

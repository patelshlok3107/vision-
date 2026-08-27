"use client";
import { useState } from "react";
import { apiUrl } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import VisionLogo from "@/components/VisionLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/login/"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, email, password }),
      });
      if (!res.ok) {
        let msg = "Invalid credentials.";
        try {
          const data = await res.json();
          if (data?.detail) msg = data.detail;
          else if (data?.email?.[0]) msg = data.email[0];
          else if (data?.password?.[0]) msg = data.password[0];
          else if (res.status === 400) msg = "Invalid request. Please check your input.";
          else if (res.status >= 500) msg = "Server error. Please try again later.";
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      login(data.access, data.refresh);
      // If guest history exists, keep it for migration prompt; otherwise go to last chat or /chat
      const last = localStorage.getItem("vision_last_chat_id");
      const hasGuest = (() => { try { const g = localStorage.getItem("vision_guest_history"); return g && JSON.parse(g).length > 0; } catch { return false; } })();
      if (hasGuest) {
        // Redirect to chat where migration banner will appear
        router.push("/chat?import_guest=1");
      } else if (last && !last.startsWith("guest_")) {
        router.push(`/chat/${last}`);
      } else {
        router.push("/chat");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Left — branding */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-10 border-r" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <VisionLogo size={32} showText={true} />
        <div>
          <h2 className="text-4xl font-light leading-tight">Your intelligence<br />layer.</h2>
          <p className="text-white/50 text-sm mt-3 max-w-sm">VISION understands, remembers and acts — local-first.</p>
          <div className="mt-8 h-32 rounded-2xl bg-white/[0.06] border border-white/10" />
        </div>
        <div className="text-xs text-white/30">© 2026 VISION</div>
      </div>
      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-2xl font-medium" style={{ color: "var(--text)" }}>Welcome back</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Enter your credentials to access your workspace</p>
          </div>
          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div>}
          <div className="space-y-3">
            <label className="text-xs tracking-widest" style={{ color: "var(--muted)" }}>EMAIL</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="m@example.com" type="email" required className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <label className="text-xs tracking-widest" style={{ color: "var(--muted)" }}>PASSWORD</label>
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? "text" : "password"} required className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
              <button type="button" onClick={()=> setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-full border" style={{borderColor:"var(--border)", color:"var(--muted)"}}>{showPw ? "Hide" : "Show"}</button>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{color:"var(--muted)"}}>
                <input type="checkbox" checked={remember} onChange={e=> setRemember(e.target.checked)} className="rounded" /> Remember me
              </label>
              <a href="#" onClick={e=>{ e.preventDefault(); alert("Password reset via email is not configured for local Ollama setup. Contact admin."); }} className="text-xs hover:opacity-100 opacity-60" style={{ color: "var(--muted)" }}>Forgot password?</a>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-full py-3 text-sm font-medium transition flex justify-center items-center" style={{ background: "var(--text)", color: "var(--bg)" }}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Continue"}
          </button>
          <p className="text-center text-sm" style={{ color: "var(--muted)" }}>Don&apos;t have an account? <Link href="/register" className="hover:underline" style={{ color: "var(--text)" }}>Sign up</Link></p>
        </form>
      </div>
    </div>
  );
}

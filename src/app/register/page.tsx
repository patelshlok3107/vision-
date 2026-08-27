"use client";
import { useState } from "react";
import { apiUrl } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import VisionLogo from "@/components/VisionLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/providers/AuthProvider";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/register/"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.email?.[0] || data.password?.[0] || data.detail || "Registration failed.");
      const tokenRes = await fetch(apiUrl("/api/auth/login/"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, email, password }),
      });
      if (tokenRes.ok) {
        const t = await tokenRes.json();
        login(t.access, t.refresh);
        const hasGuest = (() => { try { const g = localStorage.getItem("vision_guest_history"); return g && JSON.parse(g).length > 0; } catch { return false; } })();
        if (hasGuest) router.push("/chat?import_guest=1");
        else router.push("/chat");
      } else {
        let loginErr = "Account created. Please sign in.";
        try {
          const td = await tokenRes.json();
          if (td?.detail) loginErr = td.detail;
        } catch {}
        throw new Error(loginErr);
      }
    } catch (err: any) { setError(err.message || "Something went wrong."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <form onSubmit={handleRegister} className="w-full max-w-md space-y-6">
        <div className="text-center flex flex-col items-center">
          <VisionLogo size={36} showText={true} showSubtitle={true} />
          <h1 className="text-3xl font-light mt-2" style={{ color: "var(--text)" }}>Create your VISION.</h1>
          <div className="flex gap-1.5 justify-center mt-3">{[1,2,3].map(i=><span key={i} className="h-1 w-8 rounded-full" style={{ background: i===1 ? "var(--text)" : "var(--border)" }} />)}</div>
        </div>
        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div>}
        <div className="space-y-3">
          <label className="text-xs tracking-widest" style={{ color: "var(--muted)" }}>FULL NAME</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Shlok" required className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <label className="text-xs tracking-widest" style={{ color: "var(--muted)" }}>EMAIL</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="m@example.com" type="email" required className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <label className="text-xs tracking-widest" style={{ color: "var(--muted)" }}>PASSWORD</label>
          <div className="relative">
            <input value={password} onChange={e=>setPassword(e.target.value)} type={showPw ? "text" : "password"} required className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <button type="button" onClick={()=> setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-full border" style={{borderColor:"var(--border)", color:"var(--muted)"}}>{showPw ? "Hide" : "Show"}</button>
          </div>
          <label className="text-xs tracking-widest" style={{ color: "var(--muted)" }}>CONFIRM PASSWORD</label>
          <div className="relative">
            <input value={confirm} onChange={e=>setConfirm(e.target.value)} type={showConfirm ? "text" : "password"} required className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <button type="button" onClick={()=> setShowConfirm(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-full border" style={{borderColor:"var(--border)", color:"var(--muted)"}}>{showConfirm ? "Hide" : "Show"}</button>
          </div>
          <div className="text-[11px]" style={{color:"var(--muted)"}}>Password must be at least 8 characters.</div>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-full py-3 text-sm font-medium flex justify-center" style={{ background: "var(--text)", color: "var(--bg)" }}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Account"}</button>
        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>Already have an account? <Link href="/login" style={{ color: "var(--text)" }} className="hover:underline">Sign in</Link></p>
      </form>
    </div>
  );
}

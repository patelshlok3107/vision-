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

  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
  const validate = () => {
    const err: Record<string,string> = {};
    if (!name.trim()) err.name = "Full name is required.";
    else if (name.trim().length < 2) err.name = "Name too short.";
    if (!email.trim()) err.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = "Enter a valid email.";
    if (!password) err.password = "Password is required.";
    else if (password.length < 8) err.password = "Password must be at least 8 characters.";
    if (confirm !== password) err.confirm = "Passwords do not match.";
    setFieldErrors(err);
    return Object.keys(err).length===0;
  };

  const handleRegisterWithValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await handleRegister(e);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Left — branding (desktop) */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-8 lg:p-12 border-r" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <VisionLogo size={32} showText={true} />
        <div className="space-y-5 max-w-[420px]">
          <h2 className="text-[38px] font-light leading-[1.05] tracking-tight" style={{color:"var(--text)"}}>Create your<br />VISION.</h2>
          <p className="text-sm leading-relaxed" style={{color:"var(--muted)"}}>Think, create, analyze and build with VISION — your personal AI assistant.</p>
          <div className="mt-2 flex gap-2">
            {[1,2,3].map(i=> <span key={i} className="h-1.5 flex-1 rounded-full" style={{background: i===1 ? "var(--text)" : "var(--border)"}} />)}
          </div>
          <div className="rounded-2xl border p-4 flex gap-3 items-center" style={{background:"var(--bg)", borderColor:"var(--border)"}}>
            <span className="h-8 w-8 rounded-full grid place-items-center text-xs shrink-0" style={{background:"var(--text)", color:"var(--bg)"}}>✦</span>
            <span className="text-xs leading-snug" style={{color:"var(--muted)"}}>Local-first, private, fast — your intelligence layer.</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs" style={{color:"var(--muted)"}}>© 2026 VISION</div>
          <div className="text-[11px] tracking-widest" style={{color:"var(--muted)", opacity:0.7}}>Created by <span className="font-medium" style={{color:"var(--text)"}}>shlokk.patel</span></div>
        </div>
      </div>
      {/* Right — form */}
      <div className="flex-1 flex flex-col min-h-screen md:min-h-0">
        <div className="flex justify-between items-center p-4 md:justify-end" style={{paddingTop:"max(16px, env(safe-area-inset-top))"}}>
          <VisionLogo size={28} showText={false} className="md:hidden" />
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center p-6 pt-2 pb-[max(24px,env(safe-area-inset-bottom))]">
          <form onSubmit={handleRegisterWithValidation} className="w-full max-w-[360px] space-y-5" noValidate>
            <div className="md:hidden flex flex-col items-center text-center mb-1">
              <VisionLogo size={36} showText={true} showSubtitle={true} />
              <p className="text-xs mt-2" style={{color:"var(--muted)"}}>Create your VISION account</p>
            </div>
            <div className="hidden md:block">
              <h1 className="text-[22px] font-medium tracking-tight" style={{color:"var(--text)"}}>Create your VISION account</h1>
              <p className="text-sm mt-1" style={{color:"var(--muted)"}}>Start building with your intelligence layer</p>
            </div>
            {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] tracking-widest font-medium" style={{color:"var(--muted)"}}>FULL NAME</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Shlok Patel" required className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none mt-1.5" style={{ background: fieldErrors.name ? "rgba(239,68,68,0.06)" : "var(--surface)", border: `1px solid ${fieldErrors.name ? "#ef4444" : "var(--border)"}`, color: "var(--text)" }} />
                {fieldErrors.name && <div className="text-xs text-red-400 mt-1">{fieldErrors.name}</div>}
              </div>
              <div>
                <label className="text-[11px] tracking-widest font-medium" style={{color:"var(--muted)"}}>EMAIL</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="m@example.com" type="email" required className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none mt-1.5" style={{ background: fieldErrors.email ? "rgba(239,68,68,0.06)" : "var(--surface)", border: `1px solid ${fieldErrors.email ? "#ef4444" : "var(--border)"}`, color: "var(--text)" }} />
                {fieldErrors.email && <div className="text-xs text-red-400 mt-1">{fieldErrors.email}</div>}
              </div>
              <div>
                <label className="text-[11px] tracking-widest font-medium" style={{color:"var(--muted)"}}>PASSWORD</label>
                <div className="relative mt-1.5">
                  <input value={password} onChange={e=>setPassword(e.target.value)} type={showPw ? "text" : "password"} required className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none" style={{ background: fieldErrors.password ? "rgba(239,68,68,0.06)" : "var(--surface)", border: `1px solid ${fieldErrors.password ? "#ef4444" : "var(--border)"}`, color: "var(--text)" }} />
                  <button type="button" onClick={()=> setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] px-2.5 py-1 rounded-full border" style={{borderColor:"var(--border)", color:"var(--muted)"}}>{showPw ? "Hide" : "Show"}</button>
                </div>
                {fieldErrors.password ? <div className="text-xs text-red-400 mt-1">{fieldErrors.password}</div> : <div className="text-[11px] mt-1" style={{color:"var(--muted)"}}>At least 8 characters.</div>}
              </div>
              <div>
                <label className="text-[11px] tracking-widest font-medium" style={{color:"var(--muted)"}}>CONFIRM PASSWORD</label>
                <div className="relative mt-1.5">
                  <input value={confirm} onChange={e=>setConfirm(e.target.value)} type={showConfirm ? "text" : "password"} required className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none" style={{ background: fieldErrors.confirm ? "rgba(239,68,68,0.06)" : "var(--surface)", border: `1px solid ${fieldErrors.confirm ? "#ef4444" : "var(--border)"}`, color: "var(--text)" }} />
                  <button type="button" onClick={()=> setShowConfirm(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] px-2.5 py-1 rounded-full border" style={{borderColor:"var(--border)", color:"var(--muted)"}}>{showConfirm ? "Hide" : "Show"}</button>
                </div>
                {fieldErrors.confirm && <div className="text-xs text-red-400 mt-1">{fieldErrors.confirm}</div>}
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-full py-3 text-sm font-medium flex justify-center hover:opacity-90 active:scale-[0.98] transition" style={{ background: "var(--text)", color: "var(--bg)" }}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Account"}</button>
            <p className="text-center text-sm" style={{ color: "var(--muted)" }}>Already have an account? <Link href="/login" style={{ color: "var(--text)" }} className="hover:underline font-medium">Sign in</Link></p>
            <div className="text-center text-[10px] tracking-widest pt-1" style={{color:"var(--muted)", opacity:0.6}}>Created by shlokk.patel</div>
          </form>
        </div>
      </div>
    </div>
  );
}

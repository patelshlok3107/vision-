"use client";
import { useState } from "react";
import { apiUrl } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import VisionLogo from "@/components/VisionLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/providers/AuthProvider";
import { adminApi, setAdminToken } from "@/lib/admin";

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
      // Merged admin login: if admin email, also obtain admin token and go to /admin
      const isAdminEmail = email.trim().toLowerCase() === "admin123@gmail.com" || email.trim().toLowerCase() === "admin";
      if (isAdminEmail) {
        try {
          const adminRes = await adminApi.login(email.trim(), password);
          if (adminRes.token) {
            setAdminToken(adminRes.token);
            router.push("/admin");
            return;
          }
        } catch {}
        // Fallback: if user is staff, still allow /admin via normal JWT (permission accepts staff)
        try {
          // Check if normal token is staff by hitting admin dashboard with normal token
          const check = await fetch(apiUrl("/api/admin/dashboard"), { headers: { Authorization: `Bearer ${data.access}` } });
          if (check.ok) {
            // Store normal token as admin fallback (AdminLayout will accept it)
            // Also store as adminToken for AdminLayout convenience
            setAdminToken(data.access);
            router.push("/admin");
            return;
          }
        } catch {}
      }
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
      // Fallback for admin: if normal login fails but credentials match admin, try admin login directly
      const isAdminEmailFallback = email.trim().toLowerCase() === "admin123@gmail.com" || email.trim().toLowerCase() === "admin";
      if (isAdminEmailFallback) {
        try {
          const adminRes = await adminApi.login(email.trim(), password);
          if (adminRes.token) {
            setAdminToken(adminRes.token);
            // Also create a normal JWT via ensure (admin login auto-creates User), try again to get normal token for chat
            try {
              const retry = await fetch(apiUrl("/api/auth/login/"), {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: email, email, password }),
              });
              if (retry.ok) {
                const d2 = await retry.json();
                login(d2.access, d2.refresh);
              }
            } catch {}
            router.push("/admin");
            return;
          }
        } catch (adminErr: any) {
          // Show admin error if more specific
          if (adminErr.message && !err.message.includes("No active")) {
            setError(adminErr.message);
            return;
          }
        }
      }
      setError(err.message || "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Left — branding (desktop) */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-8 lg:p-12 border-r relative overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <VisionLogo size={32} showText={true} />
        <div className="space-y-5 max-w-[420px]">
          <h2 className="text-[40px] font-light leading-[1.05] tracking-tight" style={{color:"var(--text)"}}>Your intelligence<br />layer.</h2>
          <p className="text-sm leading-relaxed" style={{color:"var(--muted)"}}>Think, create, analyze and build with VISION — your personal AI assistant.</p>
          <div className="mt-2 grid grid-cols-3 gap-3 opacity-80">
            <div className="rounded-2xl border p-4 h-28 flex flex-col justify-between" style={{background:"var(--bg)", borderColor:"var(--border)"}}>
              <span className="text-xs" style={{color:"var(--muted)"}}>01 — Chat</span>
              <span className="text-xs leading-snug" style={{color:"var(--text)"}}>Fast, private, streaming</span>
            </div>
            <div className="rounded-2xl border p-4 h-28 flex flex-col justify-between" style={{background:"var(--bg)", borderColor:"var(--border)"}}>
              <span className="text-xs" style={{color:"var(--muted)"}}>02 — Code</span>
              <span className="text-xs leading-snug" style={{color:"var(--text)"}}>Complete apps</span>
            </div>
            <div className="rounded-2xl border p-4 h-28 flex flex-col justify-between" style={{background:"var(--bg)", borderColor:"var(--border)"}}>
              <span className="text-xs" style={{color:"var(--muted)"}}>03 — Vision</span>
              <span className="text-xs leading-snug" style={{color:"var(--text)"}}>See & analyze</span>
            </div>
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
          <form onSubmit={handleLogin} className="w-full max-w-[360px] space-y-5">
            <div className="md:hidden flex flex-col items-center text-center mb-2">
              <VisionLogo size={36} showText={true} showSubtitle={true} />
              <p className="text-xs mt-3 max-w-[280px]" style={{color:"var(--muted)"}}>Think, create, analyze and build with VISION — your personal AI assistant.</p>
            </div>
            <div>
              <h1 className="text-[22px] font-medium tracking-tight" style={{ color: "var(--text)" }}>Welcome back</h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Enter your credentials to access your workspace</p>
            </div>
            {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] tracking-widest font-medium" style={{ color: "var(--muted)" }}>EMAIL</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="m@example.com" type="email" required className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none mt-1.5 transition" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
              </div>
              <div>
                <label className="text-[11px] tracking-widest font-medium" style={{ color: "var(--muted)" }}>PASSWORD</label>
                <div className="relative mt-1.5">
                  <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? "text" : "password"} required className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none transition" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
                  <button type="button" onClick={()=> setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] px-2.5 py-1 rounded-full border transition" style={{borderColor:"var(--border)", color:"var(--muted)"}}>{showPw ? "Hide" : "Show"}</button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{color:"var(--muted)"}}>
                  <input type="checkbox" checked={remember} onChange={e=> setRemember(e.target.checked)} className="rounded w-3.5 h-3.5" /> Remember me
                </label>
                <a href="#" onClick={e=>{ e.preventDefault(); alert("Password reset via email is not configured. Contact admin."); }} className="text-xs hover:underline" style={{ color: "var(--muted)" }}>Forgot password?</a>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-full py-3 text-sm font-medium transition flex justify-center items-center hover:opacity-90 active:scale-[0.98]" style={{ background: "var(--text)", color: "var(--bg)" }}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Continue"}
            </button>
            <p className="text-center text-sm" style={{ color: "var(--muted)" }}>Don&apos;t have an account? <Link href="/register" className="hover:underline font-medium" style={{ color: "var(--text)" }}>Sign up</Link></p>
            <div className="text-center text-[10px] tracking-widest pt-2" style={{color:"var(--muted)", opacity:0.6}}>Created by shlokk.patel</div>
          </form>
        </div>
      </div>
    </div>
  );
}

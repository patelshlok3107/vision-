"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { adminApi, clearAdminToken, getAdminToken } from "@/lib/admin";
import VisionLogo from "@/components/VisionLogo";

const NAV = [
  { href: "/admin", label: "Overview", icon: "◈" },
  { href: "/admin/users", label: "Users", icon: "◐" },
  { href: "/admin/knowledge", label: "Knowledge", icon: "⬢" },
  { href: "/admin/knowledge/history", label: "Training Jobs", icon: "⟡" },
  { href: "/admin/activity", label: "Activity", icon: "⧉" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const t = getAdminToken();
    if (!t) { setOk(false); router.replace("/admin/login"); return; }
    adminApi.me().then(() => setOk(true)).catch(() => { clearAdminToken(); setOk(false); router.replace("/admin/login"); });
  }, [router]);

  const logout = async () => {
    try { await adminApi.logout(); } catch {}
    clearAdminToken();
    router.replace("/admin/login");
  };

  if (ok === null) {
    return <div className="min-h-[100dvh] grid place-items-center" style={{ background: "var(--bg)", color: "var(--text)" }}><div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" /></div>;
  }
  if (ok === false) return null;

  return (
    <div className="flex" style={{ height: "100dvh", overflow: "hidden", background: "var(--bg)", color: "var(--text)" }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] flex-col border-r shrink-0" style={{ borderColor: "var(--border)", background: "var(--sidebar-bg)" }}>
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg grid place-items-center text-xs font-bold" style={{ background: "var(--text)", color: "var(--bg)" }}>V</div>
            <span className="text-sm font-medium tracking-widest">VISION ADMIN</span>
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>Control Center</div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(n => {
            const active = path === n.href || (n.href !== "/admin" && path?.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${active ? "font-medium" : "opacity-70 hover:opacity-100"}`} style={active ? { background: "var(--text)", color: "var(--bg)" } : { color: "var(--text)" }}>
                <span className="text-xs w-4 text-center">{n.icon}</span> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={logout} className="w-full text-left px-3 py-2 rounded-xl text-sm opacity-60 hover:opacity-100" style={{ color: "var(--text)" }}>Logout</button>
          <Link href="/chat" className="block px-3 py-2 text-xs opacity-40 hover:opacity-80">← Back to VISION</Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="w-[280px] max-w-[80vw] flex flex-col border-r" style={{ background: "var(--sidebar-bg)", borderColor: "var(--border)" }}>
            <div className="p-5 flex justify-between items-center border-b" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm font-medium tracking-widest">VISION ADMIN</span>
              <button onClick={() => setDrawer(false)} className="h-8 w-8 grid place-items-center rounded-full border text-sm" style={{ borderColor: "var(--border)" }}>×</button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto"
              onClick={(e) => { const t = e.target as HTMLElement; if (t.closest("a")) setDrawer(false); }}>
              {NAV.map(n => {
                const active = path === n.href || (n.href !== "/admin" && path?.startsWith(n.href));
                return <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${active ? "font-medium" : "opacity-70"}`} style={active ? { background: "var(--text)", color: "var(--bg)" } : { color: "var(--text)" }}><span className="text-xs w-4 text-center">{n.icon}</span>{n.label}</Link>;
              })}
            </nav>
            <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
              <button onClick={logout} className="w-full text-left px-3 py-2 text-sm opacity-60">Logout</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0" style={{ height: "100dvh", overflow: "hidden" }}>
        <div className="md:hidden flex items-center justify-between px-4 shrink-0" style={{ height: "calc(56px + env(safe-area-inset-top))", paddingTop: "env(safe-area-inset-top)", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
          <button onClick={() => setDrawer(true)} className="h-9 w-9 grid place-items-center rounded-full border text-sm" style={{ borderColor: "var(--border)" }}>☰</button>
          <span className="text-sm font-medium tracking-widest">VISION ADMIN</span>
          <div className="h-9 w-9" />
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ background: "var(--bg)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

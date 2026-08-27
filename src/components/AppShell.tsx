"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import VisionLogo from "@/components/VisionLogo";

const nav: {href:string; label:string; icon:string}[] = [
  {href:"/chat", label:"Chat", icon:"💬"},
  {href:"/settings", label:"Settings", icon:"⚙️"},
  {href:"/desktop", label:"Desktop", icon:"🖥️"},
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="flex" style={{ height: "100dvh", overflow: "hidden", background: "var(--bg)", color: "var(--text)" }}>
      <aside className="hidden md:flex w-56 flex-col border-r p-6" style={{ height: "100dvh", flexShrink: 0, overflow: "hidden", background: "var(--bg)", borderColor: "var(--border)" }}>
        <VisionLogo size={28} showText={true} />
        <div className="h-px my-6" style={{ background: "var(--border)" }} />
        <nav className="space-y-1 flex-1 min-h-0 overflow-y-auto">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${path===n.href?"bg-[var(--text)] text-[var(--bg)]":"opacity-60 hover:opacity-100 hover:bg-[var(--surface)]"}`} style={path!==n.href?{color:"var(--text)"}:undefined}>
              <span className="text-xs">{n.icon}</span> {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 text-sm shrink-0" style={{ color: "var(--muted)" }}>
          <Link href="/settings" className="block hover:opacity-100 opacity-80" style={{ color: "var(--text)" }}>Settings</Link>
          <Link href="/profile" className="block hover:opacity-100 opacity-80" style={{ color: "var(--text)" }}>Profile</Link>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0" style={{ height: "100dvh", overflow: "hidden" }}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">{children}</div>
        <div className="md:hidden flex justify-around py-2 shrink-0" style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
          {nav.slice(0,5).map(n=>(
            <Link key={n.href} href={n.href} className={`px-3 py-2 rounded-full text-xs ${path===n.href?"bg-[var(--text)] text-[var(--bg)]":"opacity-60"}`} style={path!==n.href?{color:"var(--text)"}:undefined}>{n.icon}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}

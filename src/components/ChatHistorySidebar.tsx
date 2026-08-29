"use client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { listConversations, searchConversations, archiveConversation, deleteConversation, renameConversation, type Conversation, clearGuestHistory } from "@/lib/conversations";
import VisionLogo from "@/components/VisionLogo";
import { useAuth } from "@/providers/AuthProvider";
import { UpdateHeaderIndicator } from "@/components/UpdateBanner";
import { getLocalSettings } from "@/lib/settings";

function groupByDate(convs: Conversation[]) {
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate()-7);
  const groups: Record<string, Conversation[]> = { TODAY: [], YESTERDAY: [], "PREVIOUS 7 DAYS": [], OLDER: [] };
  for (const c of convs) {
    const d = new Date(c.updated_at);
    if (d >= today) groups["TODAY"].push(c);
    else if (d >= yesterday) groups["YESTERDAY"].push(c);
    else if (d >= weekAgo) groups["PREVIOUS 7 DAYS"].push(c);
    else groups["OLDER"].push(c);
  }
  return groups;
}

export default function ChatHistorySidebar({ activeId, onNewChat }: { activeId?: string; onNewChat?: () => void }) {
  const { isAuthenticated, logout } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const router = useRouter();

  const refresh = async () => {
    if (!isAuthenticated) { setConvs([]); return; }
    try {
      if (q.trim()) {
        setSearching(true);
        const res = await searchConversations(q);
        setConvs(res);
        setSearching(false);
      } else {
        const res = await listConversations({ limit: 100 });
        setConvs(res);
      }
    } catch {
      setConvs([]);
      setSearching(false);
    }
  };

  useEffect(() => { refresh(); }, [isAuthenticated]);
  useEffect(() => {
    if (!isAuthenticated) return;
    const t = setTimeout(refresh, 300);
    return () => clearTimeout(t);
  }, [q, isAuthenticated]);

  const groups = useMemo(() => groupByDate(convs), [convs]);

  const handleRename = async (id: string) => {
    if (!renameVal.trim()) return;
    await renameConversation(id, renameVal.trim());
    setRenameId(null);
    refresh();
  };

  const handleNewChat = () => {
    if (!isAuthenticated) {
      clearGuestHistory();
    }
    onNewChat?.();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header p-4 space-y-3">
        <VisionLogo size={26} showText={true} />
        <button onClick={handleNewChat} className="w-full rounded-full py-2.5 text-sm font-medium hover:opacity-90 transition-colors" style={{ background: "var(--button-bg)", color: "var(--button-text)" }}>+ New Chat</button>
        {isAuthenticated ? (
          <div className="relative">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search conversations..." className="w-full rounded-xl px-3 py-2 text-xs outline-none" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
            {searching && <span className="absolute right-3 top-2.5 text-xs" style={{ color: "var(--muted)" }}>…</span>}
          </div>
        ) : null}
      </div>

      <div className="sidebar-history px-3 pb-4 space-y-5">
        {!isAuthenticated ? (
          <div className="px-2 py-6 text-center">
            <div className="text-xs font-medium" style={{ color: "var(--text)" }}>Guest mode</div>
            <div className="text-[11px] mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>Sign in to save conversations, memory, and projects.</div>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/login" className="w-full rounded-full py-2 text-xs font-medium text-center" style={{ background: "var(--button-bg)", color: "var(--button-text)" }}>Log in</Link>
              <Link href="/register" className="w-full rounded-full py-2 text-xs text-center" style={{ border: "1px solid var(--border)", color: "var(--text)" }}>Create account</Link>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(groups).map(([label, items]) => items.length===0 ? null : (
              <div key={label}>
                <div className="text-[10px] tracking-widest px-2 mb-2" style={{ color: "var(--muted)" }}>{label}</div>
                <div className="space-y-1">
                  {items.map(c=>(
                    <div key={c.id} className="group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm" style={activeId===c.id ? { background: "var(--button-bg)", color: "var(--button-text)" } : { color: "var(--text-secondary)" }} onMouseEnter={e=>{ if(activeId!==c.id) e.currentTarget.style.background="var(--surface-hover)"}} onMouseLeave={e=>{ if(activeId!==c.id) e.currentTarget.style.background="transparent"}}>
                      <Link href={`/chat/${c.id}`} onClick={()=>{ try{localStorage.setItem("vision_last_chat_id", c.id);}catch{}}} className="flex-1 min-w-0 truncate text-left block">
                        {renameId===c.id ? (
                          <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") handleRename(c.id); if(e.key==="Escape") setRenameId(null)}} onClick={e=>e.preventDefault()} className="w-full bg-transparent outline-none text-sm border-b border-black/20" />
                        ) : (
                          <span className="truncate block whitespace-nowrap overflow-hidden text-ellipsis" style={{maxWidth:"100%"}}>{c.title}</span>
                        )}
                      </Link>
                      <button onClick={()=>setMenu(menu===c.id?null:c.id)} className="ml-2 shrink-0 opacity-0 group-hover:opacity-100 hover:text-current" style={{ color: activeId===c.id ? "var(--button-text)" : "var(--muted)", opacity: 0.7 }}>⋯</button>
                      {menu===c.id && (
                        <div className="absolute right-0 top-9 rounded-xl py-1 text-xs z-20 w-36 shadow-large" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                          <button onClick={()=>{ setRenameVal(c.title); setRenameId(c.id); setMenu(null);}} className="w-full text-left px-3 py-2 hover:opacity-80" style={{ color: "var(--text)" }}>Rename</button>
                          <button onClick={async()=>{ await archiveConversation(c.id); setMenu(null); refresh();}} className="w-full text-left px-3 py-2 hover:opacity-80" style={{ color: "var(--text)" }}>Archive</button>
                          <button onClick={async()=>{ try{ const s=getLocalSettings(); const needConfirm=s.confirm_delete!==false; if(!needConfirm || confirm("Delete this conversation? This will permanently remove it and its messages.")){ await deleteConversation(c.id); setMenu(null); if(activeId===c.id) router.push("/chat"); refresh();}} catch{ if(confirm("Delete this conversation? This will permanently remove it and its messages.")){ await deleteConversation(c.id); setMenu(null); if(activeId===c.id) router.push("/chat"); refresh();}}}} className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-400">Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {convs.length===0 && <div className="text-center text-xs py-10" style={{ color: "var(--muted)" }}>No conversations yet.</div>}
          </>
        )}
      </div>

      <div className="p-3">
        <UpdateHeaderIndicator />
      </div>
      <div className="sidebar-nav p-3 space-y-1 text-xs" style={{ background: "var(--sidebar-bg)", borderColor: "var(--border)", color: "var(--muted)" }}>
        {isAuthenticated ? (
          <>
            <Link href="/settings" className="block px-2 py-1.5 rounded-lg hover:opacity-100" style={{ color: "var(--muted)" }} onMouseEnter={e=> e.currentTarget.style.color="var(--text)"} onMouseLeave={e=> e.currentTarget.style.color="var(--muted)"}>Settings</Link>
            <Link href="/profile" className="block px-2 py-1.5 rounded-lg hover:opacity-100" style={{ color: "var(--muted)" }} onMouseEnter={e=> e.currentTarget.style.color="var(--text)"} onMouseLeave={e=> e.currentTarget.style.color="var(--muted)"}>Profile</Link>
            <button onClick={()=>{ logout(); router.push("/"); }} className="w-full text-left block px-2 py-1.5 rounded-lg hover:opacity-100" style={{ color: "var(--muted)" }} onMouseEnter={e=> e.currentTarget.style.color="var(--text)"} onMouseLeave={e=> e.currentTarget.style.color="var(--muted)"}>Logout</button>
          </>
        ) : (
          <>
            <Link href="/login" className="block px-2 py-1.5 rounded-lg hover:opacity-100" style={{ color: "var(--muted)" }} onMouseEnter={e=> e.currentTarget.style.color="var(--text)"} onMouseLeave={e=> e.currentTarget.style.color="var(--muted)"}>Sign in</Link>
            <Link href="/register" className="block px-2 py-1.5 rounded-lg hover:opacity-100" style={{ color: "var(--muted)" }} onMouseEnter={e=> e.currentTarget.style.color="var(--text)"} onMouseLeave={e=> e.currentTarget.style.color="var(--muted)"}>Create account</Link>
          </>
        )}
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function AuthHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!isAuthenticated) return;
    fetch("http://127.0.0.1:8000/api/auth/profile/",{headers:{Authorization:`Bearer ${localStorage.getItem("accessToken")||""}`}}).then(r=>r.json()).then(j=> setAvatar(j.avatar||null)).catch(()=>{});
  },[isAuthenticated]);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(ref.current && !ref.current.contains(e.target as any)) setOpen(false); };
    document.addEventListener("click",h); return()=> document.removeEventListener("click",h);
  },[]);
  const handleLogout = () => {
    logout();
    router.push("/");
  };
  const initials = (user?.name || user?.email || "U").charAt(0).toUpperCase();
  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3 relative" ref={ref}>
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs font-medium" style={{ color: "var(--text)" }}>{user?.name || user?.email || "User"}</span>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>{user?.email}</span>
        </div>
        <button onClick={()=> setOpen(v=>!v)} aria-label="Profile menu" className="h-8 w-8 rounded-full overflow-hidden grid place-items-center text-xs font-medium border shrink-0" style={{ background: "var(--surface)", borderColor:"var(--border)", color:"var(--text)" }}>
          {avatar ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" /> : initials}
        </button>
        {open && (
          <div className="absolute right-0 top-10 w-64 rounded-2xl border shadow-xl overflow-hidden z-50" style={{background:"var(--surface)", borderColor:"var(--border)"}}>
            <div className="p-3 flex gap-3 border-b" style={{borderColor:"var(--border)"}}>
              <div className="h-8 w-8 rounded-full overflow-hidden grid place-items-center text-xs border shrink-0" style={{background:"var(--bg)", borderColor:"var(--border)"}}>
                {avatar ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" /> : initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm truncate" style={{color:"var(--text)"}}>{user?.name || "User"}</div>
                <div className="text-xs truncate" style={{color:"var(--muted)"}}>{user?.email}</div>
              </div>
            </div>
            <div className="p-2 space-y-1">
              <Link onClick={()=> setOpen(false)} href="/profile" className="block px-3 py-2 rounded-xl text-sm hover:bg-black/5 dark:hover:bg-white/5" style={{color:"var(--text)"}}>Profile</Link>
              <Link onClick={()=> setOpen(false)} href="/settings" className="block px-3 py-2 rounded-xl text-sm hover:bg-black/5 dark:hover:bg-white/5" style={{color:"var(--text)"}}>Settings</Link>
              <Link onClick={()=> setOpen(false)} href="/settings" className="block px-3 py-2 rounded-xl text-sm hover:bg-black/5 dark:hover:bg-white/5" style={{color:"var(--text)"}}>Memory</Link>
              <a href="#" onClick={(e)=>{ e.preventDefault(); setOpen(false); alert("Help: docs at /settings → About");}} className="block px-3 py-2 rounded-xl text-sm hover:bg-black/5 dark:hover:bg-white/5" style={{color:"var(--text)"}}>Help</a>
            </div>
            <div className="p-2 border-t" style={{borderColor:"var(--border)"}}>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-black/5 dark:hover:bg-white/5" style={{color:"var(--text)"}}>Log out</button>
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="text-xs px-4 py-2 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Log in</Link>
      <Link href="/register" className="text-xs px-4 py-2 rounded-full font-medium" style={{ background: "var(--text)", color: "var(--bg)" }}>Sign up</Link>
    </div>
  );
}

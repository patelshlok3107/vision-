"use client";
import { useState, useRef, useEffect } from "react";

export default function OptionsMenu({ memoryEnabled, onToggleMemory, onOpenMemory, onOpenWorkspace, localBadge }: { memoryEnabled: boolean, onToggleMemory: ()=>void, onOpenMemory: ()=>void, onOpenWorkspace: ()=>void, localBadge?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", h); return ()=>document.removeEventListener("click", h);
  },[]);
  return (
    <div ref={ref} className="relative">
      <button onClick={()=>setOpen(v=>!v)} className="h-9 w-9 rounded-full bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10 text-sm">⋯</button>
      {open && (
        <div className="absolute bottom-10 right-0 w-64 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-xl overflow-hidden z-20">
          <div className="px-3 py-2 text-[11px] tracking-widest text-white/30">OPTIONS</div>
          <button onClick={()=>{ onToggleMemory(); }} className="w-full flex justify-between items-center px-3 py-2.5 text-sm hover:bg-white/5 text-left">
            <span>🧠 Memory</span><span className={`px-2 py-0.5 rounded-full text-xs border ${memoryEnabled?"bg-emerald-500/20 border-emerald-500/30 text-emerald-300":"bg-white/5 border-white/10 text-white/40"}`}>{memoryEnabled?"ON":"OFF"}</span>
          </button>
          <button onClick={()=>{ setOpen(false); onOpenMemory(); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-white/5">View Memory</button>
          <button onClick={()=>{ setOpen(false); onOpenWorkspace(); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-white/5">📁 Workspace</button>
          <div className="px-3 py-2.5 text-sm flex justify-between items-center">
            <span>Local model</span>{localBadge}
          </div>
          <div className="h-px bg-white/10 mx-3 my-1" />
          <div className="px-3 py-2 text-xs text-white/30">Conversation settings — coming soon</div>
        </div>
      )}
    </div>
  );
}

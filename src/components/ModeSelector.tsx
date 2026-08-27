"use client";
import { useState, useRef, useEffect } from "react";

export type VISIONMode = "auto"|"fast"|"think"|"vision"|"code"|"agent";
const OPTIONS: {id: VISIONMode, label: string, icon: string, desc: string}[] = [
  {id:"auto", label:"Auto", icon:"✦", desc:"Auto-detect"},
  {id:"fast", label:"Fast", icon:"⚡", desc:"Quick answers"},
  {id:"think", label:"Think", icon:"🧠", desc:"Deeper reasoning"},
  {id:"vision", label:"Vision", icon:"👁", desc:"Image analysis"},
  {id:"code", label:"Code", icon:"💻", desc:"Developer"},
  {id:"agent", label:"Agent", icon:"🤖", desc:"Tools & actions"},
];

export default function ModeSelector({value, onChange, available}: {value: VISIONMode, onChange:(m:VISIONMode)=>void, available?: Record<string,boolean>}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", h); return ()=>document.removeEventListener("click", h);
  },[]);
  const cur = OPTIONS.find(o=>o.id===value) || OPTIONS[0];
  return (
    <div ref={ref} className="relative">
      <button onClick={()=>setOpen(v=>!v)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs hover:bg-white/10">
        <span>{cur.icon}</span><span>{cur.label}</span><span className="text-white/30">▾</span>
      </button>
      {open && (
        <div className="absolute bottom-10 left-0 w-64 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-xl overflow-hidden z-20">
          <div className="px-3 py-2 text-[11px] tracking-widest text-white/30">VISION MODE</div>
          {OPTIONS.map(o=>{
            const disabled = available && available[o.id]===false;
            const active = o.id===value;
            return (
              <button key={o.id} onClick={()=>{ if(disabled) return; onChange(o.id); setOpen(false); }} disabled={!!disabled} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-white/5 ${active?"bg-white text-black hover:bg-white":"text-white/80"} ${disabled?"opacity-30 cursor-not-allowed":""}`}>
                <span className="w-6 text-center">{o.icon}</span>
                <div className="flex-1"><div className="text-sm">{o.label}</div><div className={`text-xs ${active?"text-black/60":"text-white/40"}`}>{o.desc}</div></div>
                {active && <span className="text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

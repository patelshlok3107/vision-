"use client";
import { useEffect, useState } from "react";
import { listMemories, deleteMemory, clearMemories, createMemory, togglePin, type Memory } from "@/lib/memory";

export default function MemoryPanel({open, onClose}: {open: boolean, onClose: ()=>void}) {
  const [mems, setMems] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async()=>{
    setLoading(true);
    try{ const d = await listMemories(); setMems(d);} catch{} finally{ setLoading(false);}
  };
  useEffect(()=>{ if(open) load(); },[open]);
  const handleAdd = async()=>{
    if(!newContent.trim()) return;
    await createMemory(newContent.trim());
    setNewContent(""); load();
  };
  const handleDelete = async(id:string)=>{ await deleteMemory(id); load(); };
  const handleClear = async()=>{
    if(!confirm("Forget everything VISION remembers? This cannot be undone.")) return;
    await clearMemories(); load();
  };
  const handlePin = async(m:Memory)=>{ await togglePin(m.id, !m.is_pinned); load(); };
  const exportMem = ()=>{
    const blob=new Blob([JSON.stringify(mems,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`vision-memory-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
  };
  let filtered = filter==="all" ? mems : mems.filter(m=>m.category===filter);
  if(search.trim()) filtered=filtered.filter(m=>m.content.toLowerCase().includes(search.toLowerCase()));
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-[380px] max-w-[90vw] bg-[#0a0a0a] border-l border-white/10 flex flex-col h-full">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <div>
            <div className="font-medium text-sm">Memory <span className="text-white/30 font-normal">· {mems.length}</span></div>
            <div className="text-xs text-white/40">Transparent & controllable</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/5 grid place-items-center text-sm">×</button>
        </div>
        <div className="p-3 space-y-3 border-b border-white/10">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search memories..." className="w-full rounded-full bg-white/[0.04] border border-white/10 px-3 py-2 text-xs outline-none" />
          <div className="flex gap-1.5 flex-wrap">
            {["all","preference","project","fact","instruction"].map(c=>(
              <button key={c} onClick={()=>setFilter(c)} className={`px-2.5 py-1 rounded-full text-xs border ${filter===c?"bg-white text-black":"bg-white/5 text-white/50 border-white/10"}`}>{c}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newContent} onChange={e=>setNewContent(e.target.value)} placeholder="Add a memory..." className="flex-1 rounded-full bg-white/5 border border-white/10 px-3 py-2 text-xs outline-none" onKeyDown={e=>e.key==="Enter"&&handleAdd()} />
            <button onClick={handleAdd} className="bg-white text-black rounded-full px-4 text-xs">Add</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {loading && <div className="text-xs text-white/30 py-6 text-center">Loading...</div>}
          {!loading && filtered.length===0 && <div className="text-xs text-white/30 py-6 text-center">No memories yet.<br/>VISION will remember preferences & facts automatically when Memory is ON.</div>}
          {filtered.map(m=>(
            <div key={m.id} className="rounded-xl bg-white/[0.04] border border-white/10 p-3 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-white/40 text-[10px] tracking-widest uppercase">{m.category}</span>
                <span className="text-white/20 text-[10px]">{new Date(m.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-1 text-white/80 leading-relaxed">{m.content}</div>
              <div className="mt-2 flex gap-2">
                <button onClick={()=>handlePin(m)} className={`text-[11px] px-2 py-1 rounded-full border ${m.is_pinned?"bg-emerald-500/20 border-emerald-500/30 text-emerald-300":"bg-white/5 border-white/10 text-white/50"}`}>{m.is_pinned?"★ Pinned":"☆ Pin"}</button>
                <button onClick={()=>handleDelete(m.id)} className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-red-300">Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/10 space-y-2">
          <button onClick={exportMem} className="w-full rounded-full bg-white/5 border border-white/10 py-2.5 text-xs hover:bg-white/10">Export Memories (JSON)</button>
          <button onClick={handleClear} className="w-full rounded-full bg-red-500/10 border border-red-500/20 text-red-300 py-2.5 text-xs hover:bg-red-500/20">Forget Everything</button>
          <div className="text-[10px] text-white/20 text-center">Local-only. No cloud. Sandbox per-user.</div>
        </div>
      </div>
    </div>
  );
}

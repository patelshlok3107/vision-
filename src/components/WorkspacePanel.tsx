"use client";
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";
function authHeader(): Record<string,string> {
  const t = typeof window!=="undefined" ? localStorage.getItem("accessToken")||"" : "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}
type Entry = { name: string; path: string; is_dir: boolean; size: number };

export default function WorkspacePanel({open, onClose}: {open:boolean, onClose:()=>void}) {
  const [path, setPath] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [fileContent, setFileContent] = useState("");
  const [selected, setSelected] = useState<string|null>(null);
  const [newFile, setNewFile] = useState("");
  const [newContent, setNewContent] = useState("");

  const load = async(p=path)=>{
    try{
      const res = await fetch(`${API}/api/workspace/list/?path=${encodeURIComponent(p)}`, {headers: authHeader()});
      const data = await res.json();
      if(data.entries) setEntries(data.entries);
    }catch{}
  };
  useEffect(()=>{ if(open) load(""); },[open, path]);

  const read = async(f:string)=>{
    setSelected(f);
    const res = await fetch(`${API}/api/workspace/read/?path=${encodeURIComponent(f)}`, {headers: authHeader()});
    const d = await res.json();
    if(d.content) setFileContent(d.content);
    else setFileContent(JSON.stringify(d));
  };
  const write = async()=>{
    if(!newFile) return;
    const p = path ? `${path}/${newFile}` : newFile;
    await fetch(`${API}/api/workspace/write/`, {method:"POST", headers:{...authHeader(), "Content-Type":"application/json"}, body: JSON.stringify({path: p, content: newContent})});
    setNewFile(""); setNewContent(""); load();
  };
  const del = async(f:string)=>{
    if(!confirm(`Delete ${f}?`)) return;
    await fetch(`${API}/api/workspace/delete/`, {method:"POST", headers:{...authHeader(), "Content-Type":"application/json"}, body: JSON.stringify({path: f})});
    load();
  };
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-[420px] bg-[#0a0a0a] border-l border-white/10 flex flex-col h-full">
        <div className="p-4 border-b border-white/10 flex justify-between">
          <div><div className="font-medium text-sm">Workspace</div><div className="text-xs text-white/40">Per-user sandbox — tools operate here</div></div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/5 grid place-items-center">×</button>
        </div>
        <div className="p-3 border-b border-white/10">
          <div className="flex gap-2 items-center">
            <button onClick={()=>{ setPath(""); load(""); }} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10">/ (root)</button>
            <span className="text-xs text-white/50 font-mono">{path||"/"}</span>
            <button onClick={()=>load()} className="ml-auto text-xs underline">Refresh</button>
          </div>
          <div className="mt-3 space-y-1 max-h-48 overflow-auto">
            {entries.length===0 && <div className="text-xs text-white/30 py-3">Empty. Use agent to create files or create below.</div>}
            {entries.map(e=>(
              <div key={e.path} className="flex items-center gap-2 text-xs px-2 py-1 rounded hover:bg-white/5">
                <span>{e.is_dir?"📁":"📄"}</span>
                <button onClick={()=>{
                  if(e.is_dir){ setPath(e.path); }
                  else read(e.path);
                }} className="text-left flex-1 truncate hover:text-white">{e.name}</button>
                <button onClick={()=>del(e.path)} className="text-red-300 text-[11px]">Delete</button>
              </div>
            ))}
          </div>
        </div>
        {selected && (
          <div className="p-3 border-b border-white/10">
            <div className="text-xs text-white/50">Viewing: {selected}</div>
            <pre className="mt-2 bg-black rounded p-3 text-xs max-h-40 overflow-auto whitespace-pre-wrap">{fileContent.slice(0,4000)}</pre>
            <button onClick={()=>setSelected(null)} className="mt-2 text-xs underline">Close</button>
          </div>
        )}
        <div className="p-3 mt-auto border-t border-white/10">
          <div className="text-xs text-white/50 mb-2">Create file</div>
          <input value={newFile} onChange={e=>setNewFile(e.target.value)} placeholder="path.txt" className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-xs mb-2" />
          <textarea value={newContent} onChange={e=>setNewContent(e.target.value)} placeholder="content..." className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-xs h-24" />
          <button onClick={write} className="mt-2 w-full bg-white text-black rounded-full py-2 text-xs">Create / Overwrite</button>
        </div>
      </div>
    </div>
  );
}

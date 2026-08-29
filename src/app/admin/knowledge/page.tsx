"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin";

export default function AdminKnowledgePage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [mode, setMode] = useState<"url" | "manual">("url");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchSources = async () => {
    try { const data = await adminApi.knowledgeList(); setSources(data); setErr(""); }
    catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchSources(); const id = setInterval(fetchSources, 3000); return () => clearInterval(id); }, []);

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true); setMsg("");
    try {
      await adminApi.knowledgeCreateUrl({ url: url.trim(), title: title.trim() || undefined, source_type: "url", max_pages: 20 });
      setMsg("Source added — indexing started");
      setUrl(""); setTitle("");
      setTimeout(fetchSources, 500);
    } catch (e: any) { setMsg(e.message); }
    finally { setSubmitting(false); }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualContent.trim() || manualContent.trim().length < 20) { setMsg("Content too short"); return; }
    setSubmitting(true); setMsg("");
    try {
      await adminApi.knowledgeCreateUrl({ title: title.trim() || "Manual Knowledge", content: manualContent, source_type: "text" });
      setMsg("Manual knowledge added — indexing started");
      setManualContent(""); setTitle("");
      setTimeout(fetchSources, 500);
    } catch (e: any) { setMsg(e.message); }
    finally { setSubmitting(false); }
  };

  const handleRefresh = async (id: string) => {
    try { await adminApi.knowledgeRefresh(id); setMsg("Refresh queued"); fetchSources(); } catch (e: any) { setMsg(e.message); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this source and all its indexed chunks? This cannot be undone.")) return;
    try { await adminApi.knowledgeDelete(id); fetchSources(); } catch (e: any) { setMsg(e.message); }
  };

  const statusColor: Record<string, string> = {
    queued: "bg-white/10 border-white/20 text-white/60",
    crawling: "bg-amber-500/10 border-amber-500/20 text-amber-300",
    processing: "bg-amber-500/10 border-amber-500/20 text-amber-300",
    indexing: "bg-amber-500/10 border-amber-500/20 text-amber-300",
    updating: "bg-amber-500/10 border-amber-500/20 text-amber-300",
    indexed: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    failed: "bg-red-500/10 border-red-500/20 text-red-300",
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-light">Knowledge</h1>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>RAG ingestion — crawl, chunk, embed, retrieve</p>
        </div>

        <div className="rounded-2xl border p-5 md:p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setMode("url")} className={`px-4 py-2 rounded-full text-xs border ${mode==="url" ? "font-medium" : "opacity-60"}`} style={mode==="url" ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" } : { borderColor: "var(--border)" }}>Website URL</button>
            <button onClick={() => setMode("manual")} className={`px-4 py-2 rounded-full text-xs border ${mode==="manual" ? "font-medium" : "opacity-60"}`} style={mode==="manual" ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)" } : { borderColor: "var(--border)" }}>Manual Text</button>
          </div>

          {mode === "url" ? (
            <form onSubmit={handleAddUrl} className="space-y-3">
              <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com" className="w-full rounded-xl px-4 py-3 text-sm border outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} required />
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title (optional)" className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} />
              <button type="submit" disabled={submitting} className="rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50" style={{ background: "var(--text)", color: "var(--bg)" }}>{submitting ? "Adding…" : "Add Knowledge Source"}</button>
            </form>
          ) : (
            <form onSubmit={handleAddManual} className="space-y-3">
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} required />
              <textarea value={manualContent} onChange={e=>setManualContent(e.target.value)} placeholder="Enter knowledge content (text/markdown)…" rows={6} className="w-full rounded-xl px-4 py-3 text-sm border outline-none resize-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} required />
              <button type="submit" disabled={submitting} className="rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50" style={{ background: "var(--text)", color: "var(--bg)" }}>{submitting ? "Adding…" : "Add to VISION Knowledge"}</button>
            </form>
          )}
          {msg && <div className="mt-3 text-xs" style={{ color: msg.includes("added") || msg.includes("queued") ? "#6ee7b7" : "#f87171" }}>{msg}</div>}
          <div className="mt-3 text-[11px]" style={{ color: "var(--muted)" }}>Pipeline: Validate → Fetch (robots.txt) → Extract → Clean → Chunk (800/120) → Embed (nomic) → Index → Retrieve</div>
        </div>

        <div>
          <h2 className="text-sm font-medium mb-3">Sources</h2>
          {loading ? <div className="flex justify-center py-8"><div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" /></div> : err ? <div className="text-xs text-red-400">{err}</div> : (
            <div className="space-y-3">
              {sources.map((s: any) => (
                <div key={s.id} className="rounded-2xl border p-4 md:p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{s.domain || s.url || s.title}</div>
                      <div className="text-xs truncate" style={{ color: "var(--muted)" }}>{s.url || s.title}</div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] border ${statusColor[s.status] || statusColor.queued}`}>● {s.status}</span>
                        <span className="text-[11px] px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{s.pages_indexed}/{s.pages_total} pages</span>
                        <span className="text-[11px] px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{s.chunks_total} chunks</span>
                        <span className="text-[11px] px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{s.auto_update}</span>
                      </div>
                      {s.error_message && <div className="text-xs mt-2 text-red-300 break-words">{s.error_message}</div>}
                      <div className="text-[11px] mt-2" style={{ color: "var(--muted)" }}>Updated {s.updated_at ? new Date(s.updated_at).toLocaleString() : "—"}</div>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <Link href={`/admin/knowledge/${s.id}`} className="px-4 py-2 rounded-full border text-xs" style={{ borderColor: "var(--border)", color: "var(--text)" }}>View</Link>
                      <button onClick={() => handleRefresh(s.id)} className="px-4 py-2 rounded-full border text-xs" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Refresh</button>
                      <button onClick={() => handleDelete(s.id)} className="px-4 py-2 rounded-full border text-xs text-red-400" style={{ borderColor: "rgba(239,68,68,0.2)" }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {!sources.length && <div className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>No knowledge sources yet. Add a website above.</div>}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

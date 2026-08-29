"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin";

export default function KnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [auto, setAuto] = useState("");

  const fetchDetail = async () => {
    try { const d = await adminApi.knowledgeDetail(id); setData(d); setAuto(d.auto_update); setErr(""); }
    catch (e: any) { setErr(e.message); }
  };
  useEffect(() => { fetchDetail(); const iv = setInterval(fetchDetail, 3000); return () => clearInterval(iv); }, [id]);

  const handleAutoChange = async (val: string) => {
    setAuto(val);
    try { await adminApi.knowledgeUpdate(id, { auto_update: val }); fetchDetail(); } catch (e: any) { setErr(e.message); }
  };
  const handleRefresh = async () => { try { await adminApi.knowledgeRefresh(id); fetchDetail(); } catch (e: any) { setErr(e.message); } };
  const handleDelete = async () => {
    if (!confirm("Delete this source?")) return;
    try { await adminApi.knowledgeDelete(id); router.replace("/admin/knowledge"); } catch (e: any) { setErr(e.message); }
  };

  if (err && !data) return <AdminLayout><div className="p-8 text-sm text-red-400">{err}</div></AdminLayout>;
  if (!data) return <AdminLayout><div className="p-8 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        <a href="/admin/knowledge" className="text-xs underline" style={{ color: "var(--muted)" }}>← Back to knowledge</a>
        <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h1 className="text-lg font-medium break-all">{data.url || data.title}</h1>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{data.domain}</div>
          <div className={`inline-flex mt-3 px-3 py-1 rounded-full text-xs border ${data.status==="indexed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : data.status==="failed" ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-amber-500/10 border-amber-500/20 text-amber-300"}`}>{data.status}</div>
          {data.error_message && <div className="mt-3 text-xs text-red-300 break-words">{data.error_message}</div>}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><div className="text-[11px] tracking-widest" style={{ color: "var(--muted)" }}>PAGES</div><div className="text-lg mt-1">{data.pages_indexed}/{data.pages_total}</div></div>
            <div><div className="text-[11px] tracking-widest" style={{ color: "var(--muted)" }}>CHUNKS</div><div className="text-lg mt-1">{data.chunks_total}</div></div>
            <div><div className="text-[11px] tracking-widest" style={{ color: "var(--muted)" }}>DURATION</div><div className="mt-1">{data.crawl_duration_ms ? `${(data.crawl_duration_ms/1000).toFixed(1)}s` : "—"}</div></div>
            <div><div className="text-[11px] tracking-widest" style={{ color: "var(--muted)" }}>LAST CRAWL</div><div className="text-xs mt-1">{data.last_crawled_at ? new Date(data.last_crawled_at).toLocaleString() : "—"}</div></div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <label className="text-xs" style={{ color: "var(--muted)" }}>Auto Update:</label>
            <select value={auto} onChange={e=>handleAutoChange(e.target.value)} className="rounded-full px-4 py-2 text-xs border" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}>
              <option value="manual">Manual</option>
              <option value="daily">Daily</option>
              <option value="every_3_days">Every 3 days</option>
              <option value="weekly">Weekly</option>
            </select>
            <button onClick={handleRefresh} className="px-5 py-2 rounded-full text-xs border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Refresh Source</button>
            <button onClick={handleDelete} className="px-5 py-2 rounded-full text-xs border text-red-400" style={{ borderColor: "rgba(239,68,68,0.2)" }}>Delete Source</button>
          </div>
          {data.next_crawl_at && <div className="text-xs mt-3" style={{ color: "var(--muted)" }}>Next scheduled: {new Date(data.next_crawl_at).toLocaleString()}</div>}
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="px-5 py-3 text-sm font-medium border-b" style={{ borderColor: "var(--border)" }}>Documents ({data.documents?.length || 0})</div>
          {data.documents?.length ? data.documents.map((d: any) => (
            <div key={d.id} className="px-5 py-3 border-b last:border-0 text-xs flex justify-between gap-2" style={{ borderColor: "var(--border)" }}>
              <a href={d.url} target="_blank" rel="noopener" className="truncate underline flex-1">{d.title || d.url}</a>
              <span style={{ color: "var(--muted)" }}>{d.chunks_created} chunks • {d.status}</span>
            </div>
          )) : <div className="p-6 text-xs text-center" style={{ color: "var(--muted)" }}>No documents yet</div>}
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="px-5 py-3 text-sm font-medium border-b" style={{ borderColor: "var(--border)" }}>Recent Jobs</div>
          {data.jobs?.length ? data.jobs.map((j: any) => (
            <div key={j.id} className="px-5 py-3 border-b last:border-0 text-xs flex justify-between" style={{ borderColor: "var(--border)" }}>
              <span>{j.job_type} — {j.status} — {j.progress}% — +{j.chunks_added} chunks</span>
              <span style={{ color: "var(--muted)" }}>{j.created_at ? new Date(j.created_at).toLocaleString() : ""}</span>
            </div>
          )) : <div className="p-6 text-xs text-center" style={{ color: "var(--muted)" }}>No jobs</div>}
        </div>
      </div>
    </AdminLayout>
  );
}

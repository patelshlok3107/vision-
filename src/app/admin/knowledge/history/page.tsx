"use client";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin";

export default function HistoryPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    adminApi.history().then(setJobs).catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  }, []);
  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        <h1 className="text-2xl font-light">Training History</h1>
        {err && <div className="text-xs text-red-400">{err}</div>}
        {loading ? <div className="flex justify-center py-8"><div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" /></div> : (
          <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-3 text-[11px] tracking-widest border-b" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              <span>SOURCE</span><span>OPERATION</span><span>DATE</span><span>PAGES</span><span>CHUNKS</span><span>STATUS</span><span>DURATION</span>
            </div>
            {jobs.map((j: any) => (
              <div key={j.id} className="grid md:grid-cols-7 gap-1 md:gap-2 px-4 py-3 text-xs border-b last:border-0 items-center" style={{ borderColor: "var(--border)" }}>
                <span className="truncate font-medium">{j.source || j.url}</span>
                <span className="capitalize">{j.operation}</span>
                <span style={{ color: "var(--muted)" }}>{j.created_at ? new Date(j.created_at).toLocaleDateString() : "—"}</span>
                <span>{j.pages_processed}</span>
                <span>+{j.chunks_added} {j.chunks_removed ? `-${j.chunks_removed}` : ""}</span>
                <span className={j.status==="completed" ? "text-emerald-300" : j.status==="failed" ? "text-red-300" : "text-amber-300"}>{j.status}</span>
                <span style={{ color: "var(--muted)" }}>{j.duration_ms ? `${(j.duration_ms/1000).toFixed(1)}s` : "—"}</span>
                {j.error && <div className="md:col-span-7 text-[11px] text-red-300 break-words">{j.error}</div>}
              </div>
            ))}
            {!jobs.length && <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No history yet</div>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

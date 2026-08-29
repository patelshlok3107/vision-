"use client";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="text-[11px] tracking-widest" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="text-2xl font-light mt-2" style={{ color: "var(--text)" }}>{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminApi.dashboard().then(setData).catch(e => setErr(e.message));
  }, []);

  if (err) return <AdminLayout><div className="p-8 text-sm text-red-400">{err}</div></AdminLayout>;
  if (!data) return <AdminLayout><div className="p-8 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Overview</h1>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Real-time system status</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="USERS" value={data.total_users} />
          <Stat label="ACTIVE USERS" value={data.active_users} />
          <Stat label="CONVERSATIONS" value={data.total_conversations} />
          <Stat label="MESSAGES" value={data.total_messages} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="KNOWLEDGE SOURCES" value={data.knowledge_sources} />
          <Stat label="INDEXED" value={data.indexed_sources} />
          <Stat label="FAILED JOBS" value={data.failed_jobs} />
          <Stat label="LAST UPDATE" value={data.last_knowledge_update ? new Date(data.last_knowledge_update).toLocaleDateString() : "—"} />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-medium">AI Status</div>
            <div className={`text-sm mt-2 flex items-center gap-2 ${data.ai_status==="online" ? "text-emerald-400" : "text-red-400"}`}><span className={`h-2 w-2 rounded-full ${data.ai_status==="online" ? "bg-emerald-400" : "bg-red-400"}`} /> {data.ai_status.toUpperCase()}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{data.ai_model || "—"}</div>
          </div>
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-medium">Database</div>
            <div className={`text-sm mt-2 flex items-center gap-2 ${data.database_status==="online" ? "text-emerald-400" : "text-red-400"}`}><span className={`h-2 w-2 rounded-full ${data.database_status==="online" ? "bg-emerald-400" : "bg-red-400"}`} /> {data.database_status.toUpperCase()}</div>
          </div>
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-medium">Knowledge</div>
            <div className="text-sm mt-2" style={{ color: "var(--muted)" }}>{data.indexed_sources}/{data.knowledge_sources} indexed</div>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="px-5 py-4 border-b text-sm font-medium" style={{ borderColor: "var(--border)" }}>Recent Activity</div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {data.recent_activity?.length ? data.recent_activity.map((a: any, i: number) => (
              <div key={i} className="px-5 py-3 flex justify-between text-xs">
                <span><span className="font-medium">{a.admin_username}</span> — {a.action}</span>
                <span style={{ color: "var(--muted)" }}>{new Date(a.created_at).toLocaleString()}</span>
              </div>
            )) : <div className="px-5 py-6 text-xs text-center" style={{ color: "var(--muted)" }}>No recent activity</div>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

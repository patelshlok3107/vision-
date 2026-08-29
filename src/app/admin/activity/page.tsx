"use client";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin";

export default function ActivityPage() {
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => { adminApi.activity().then(setItems).catch(e=>setErr(e.message)); }, []);
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        <h1 className="text-2xl font-light">Activity Log</h1>
        {err && <div className="text-xs text-red-400">{err}</div>}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {items.map((a: any) => (
            <div key={a.id} className="px-5 py-3 flex justify-between gap-2 text-xs border-b last:border-0" style={{ borderColor: "var(--border)" }}>
              <span><span className="font-medium">{a.admin_username}</span> — {a.action} {a.target_type ? `(${a.target_type})` : ""} <span className={a.status==="success" ? "text-emerald-300" : "text-red-300"}>• {a.status}</span></span>
              <span style={{ color: "var(--muted)" }}>{new Date(a.created_at).toLocaleString()}</span>
            </div>
          ))}
          {!items.length && <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No activity</div>}
        </div>
      </div>
    </AdminLayout>
  );
}

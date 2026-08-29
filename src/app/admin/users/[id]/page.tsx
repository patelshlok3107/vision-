"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin";

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminApi.userDetail(id).then(setData).catch(e => setErr(e.message));
  }, [id]);

  if (err) return <AdminLayout><div className="p-8 text-sm text-red-400">{err}</div></AdminLayout>;
  if (!data) return <AdminLayout><div className="p-8 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
        <a href="/admin/users" className="text-xs underline" style={{ color: "var(--muted)" }}>← Back to users</a>
        <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h1 className="text-xl font-medium">{data.username}</h1>
          <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>{data.email}</div>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-[11px] tracking-widest" style={{ color: "var(--muted)" }}>USER ID</div><div className="font-mono text-xs mt-1 break-all">{data.id}</div></div>
            <div><div className="text-[11px] tracking-widest" style={{ color: "var(--muted)" }}>STATUS</div><div className="mt-1">{data.is_active ? "Active" : "Inactive"}</div></div>
            <div><div className="text-[11px] tracking-widest" style={{ color: "var(--muted)" }}>JOINED</div><div className="mt-1">{data.date_joined ? new Date(data.date_joined).toLocaleString() : "—"}</div></div>
            <div><div className="text-[11px] tracking-widest" style={{ color: "var(--muted)" }}>LAST LOGIN</div><div className="mt-1">{data.last_login ? new Date(data.last_login).toLocaleString() : "—"}</div></div>
            <div><div className="text-[11px] tracking-widest" style={{ color: "var(--muted)" }}>CONVERSATIONS</div><div className="text-lg mt-1">{data.conversation_count}</div></div>
            <div><div className="text-[11px] tracking-widest" style={{ color: "var(--muted)" }}>MESSAGES</div><div className="text-lg mt-1">{data.message_count}</div></div>
          </div>
        </div>
        {data.recent_conversations?.length ? (
          <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="px-5 py-3 text-sm font-medium border-b" style={{ borderColor: "var(--border)" }}>Recent Conversations</div>
            {data.recent_conversations.map((c: any) => (
              <div key={c.id} className="px-5 py-3 flex justify-between text-xs border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <span className="truncate">{c.title}</span>
                <span style={{ color: "var(--muted)" }}>{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : ""}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.users({ q, filter, limit: "100" });
      setUsers(res.users || []);
      setTotal(res.total || 0);
      setErr("");
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { const t = setTimeout(fetchUsers, 400); return () => clearTimeout(t); }, [q, filter]);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light">Users</h1>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{total} total</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search users..." className="rounded-full px-4 py-2 text-sm border outline-none w-[200px]" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
            <select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-full px-4 py-2 text-sm border" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="new">New users</option>
            </select>
          </div>
        </div>

        {err && <div className="text-xs text-red-400">{err}</div>}
        {loading ? <div className="flex justify-center py-12"><div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" /></div> : (
          <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] tracking-widest" style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">USER</th>
                    <th className="text-left px-4 py-3 font-medium">EMAIL</th>
                    <th className="text-left px-4 py-3 font-medium">JOINED</th>
                    <th className="text-left px-4 py-3 font-medium">LAST ACTIVE</th>
                    <th className="text-left px-4 py-3 font-medium">CHATS</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:opacity-80">
                      <td className="px-4 py-3"><Link href={`/admin/users/${u.id}`} className="underline">{u.username}</Link></td>
                      <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{u.email}</td>
                      <td className="px-4 py-3 text-xs">{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3 text-xs">{u.last_active ? new Date(u.last_active).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3">{u.conversation_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: "var(--border)" }}>
              {users.map((u: any) => (
                <Link key={u.id} href={`/admin/users/${u.id}`} className="block p-4">
                  <div className="text-sm font-medium">{u.username}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{u.email}</div>
                  <div className="text-xs mt-1">Chats: {u.conversation_count} • Joined {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "—"}</div>
                </Link>
              ))}
            </div>
            {!users.length && <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No users found</div>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

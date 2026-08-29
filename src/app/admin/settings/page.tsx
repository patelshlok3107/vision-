"use client";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin";

export default function AdminSettingsPage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  useEffect(() => { adminApi.settings().then(setData).catch(e=>setErr(e.message)); }, []);
  if (err) return <AdminLayout><div className="p-8 text-sm text-red-400">{err}</div></AdminLayout>;
  if (!data) return <AdminLayout><div className="p-8 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" /></div></AdminLayout>;
  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
        <h1 className="text-2xl font-light">Settings</h1>
        <div className="rounded-2xl border p-6 space-y-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {[
            ["AI Model", data.ai_model || "—"],
            ["Embedding Model", data.embedding_model || "—"],
            ["Retrieval Top K", String(data.retrieval_top_k)],
            ["Min Similarity", String(data.min_similarity)],
            ["Temperature", String(data.temperature)],
            ["Max Pages / Source", String(data.max_pages)],
            ["Max Depth", String(data.max_depth)],
            ["Chunk Size", String(data.chunk_size)],
            ["Chunk Overlap", String(data.chunk_overlap)],
            ["AI Provider", data.ai_provider || "—"],
            ["Ollama URL", data.ollama_url || "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-3 border-b last:border-0 text-sm" style={{ borderColor: "var(--border)" }}>
              <span style={{ color: "var(--muted)" }}>{k}</span>
              <span className="font-mono text-xs">{v}</span>
            </div>
          ))}
          <div className="pt-2 text-[11px]" style={{ color: "var(--muted)" }}>API keys remain server-side environment variables and are never exposed here. Change values via Render/Vercel environment variables.</div>
        </div>
      </div>
    </AdminLayout>
  );
}

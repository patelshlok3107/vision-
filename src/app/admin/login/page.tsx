"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminToken } from "@/lib/admin";
import { adminApi } from "@/lib/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  useEffect(() => {
    // Merged login: redirect to main login page. Admin can login via main login with admin123@gmail.com / admin123
    if (getAdminToken()) {
      adminApi.me().then(() => router.replace("/admin")).catch(() => router.replace("/login"));
    } else {
      router.replace("/login");
    }
  }, [router]);
  return (
    <div className="min-h-[100dvh] grid place-items-center p-4" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="text-sm" style={{ color: "var(--muted)" }}>Redirecting to login…</div>
    </div>
  );
}

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text)" }}><div className="text-xs" style={{ color: "var(--muted)" }}>Loading...</div></div>;
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div className="text-sm font-medium">Sign in required</div>
        <div className="text-xs mt-2" style={{ color: "var(--muted)" }}>This feature requires an account.</div>
        <a href="/login" className="mt-6 px-6 py-2 rounded-full text-sm font-medium" style={{ background: "var(--text)", color: "var(--bg)" }}>Log in</a>
      </div>
    );
  }
  return <>{children}</>;
}

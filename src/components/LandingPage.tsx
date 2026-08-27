"use client";
import Link from "next/link";
import VisionLogo from "@/components/VisionLogo";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <VisionLogo size={24} showText={true} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="text-sm px-4 py-2 rounded-full border hover:opacity-80 transition" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Log in</Link>
          <Link href="/register" className="text-sm px-5 py-2 rounded-full font-medium transition" style={{ background: "var(--text)", color: "var(--bg)" }}>Sign up</Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex flex-col items-center">
          <VisionLogo size={64} showText={true} showSubtitle={true} className="mb-6" />
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mt-4" style={{ color: "var(--text)" }}>
            Your Personal AI Assistant
          </h1>
          <p className="text-sm md:text-base mt-4 max-w-xl leading-relaxed" style={{ color: "var(--muted)" }}>
            VISION is local-first intelligence — reason, remember and act. Private, fast, and designed to evolve with you. Powered by Ollama on your machine.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            <Link href="/chat" className="px-8 py-3 rounded-full text-sm font-medium transition hover:opacity-90 text-center" style={{ background: "var(--text)", color: "var(--bg)" }}>
              Try VISION →
            </Link>
            <Link href="/login" className="px-8 py-3 rounded-full text-sm font-medium border transition hover:opacity-80 text-center" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
              Log in
            </Link>
            <Link href="/register" className="px-8 py-3 rounded-full text-sm font-medium border transition hover:opacity-80 text-center" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
              Create account
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full text-left">
            {[
              { title: "Private & Local", desc: "Runs on your machine via Ollama. Your data never leaves your device." },
              { title: "Remembers You", desc: "Memory, projects, and preferences — VISION learns with you over time." },
              { title: "Acts for You", desc: "Code, files, terminal and agent mode — beyond chat." },
            ].map(c => (
              <div key={c.title} className="rounded-2xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.title}</div>
                <div className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--muted)" }}>{c.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-xs" style={{ color: "var(--muted)" }}>
            Guest chat is free — no account required. Sign in to unlock history, memory, projects and more.
          </div>
        </div>
      </main>

      <footer className="px-6 md:px-10 py-4 border-t flex justify-between text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
        <span>© 2026 VISION</span>
        <span>Local-first • Ollama powered</span>
      </footer>
    </div>
  );
}

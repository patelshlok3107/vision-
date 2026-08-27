"use client";
import Link from "next/link";

export default function LandingNav() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[min(900px,92vw)]">
      <div className="glass rounded-full px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-display text-[13px] tracking-[0.32em] text-white">VISION</Link>
        <div className="hidden md:flex items-center gap-7 text-[13px] text-white/70">
          <a href="#product" className="hover:text-white transition">Product</a>
          <a href="#capabilities" className="hover:text-white transition">Capabilities</a>
          <a href="#technology" className="hover:text-white transition">Technology</a>
          <a href="#about" className="hover:text-white transition">About</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/80 hover:text-white px-4 py-1.5">Sign In</Link>
          <Link href="/register" className="bg-white text-black rounded-full px-5 py-1.5 text-sm font-medium hover:bg-white/90 transition">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

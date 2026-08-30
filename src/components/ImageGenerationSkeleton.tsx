"use client";
import React, { useEffect, useState } from "react";

export default function ImageGenerationSkeleton({ status = "Creating your image..." }: { status?: string }) {
  const [dots, setDots] = useState("");
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 380);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 2500);
    return () => clearTimeout(t);
  }, []);
  const display = phase === 1 && status.includes("Creating") ? "Finishing details" : status.replace(/\.\.\.*/, "");

  return (
    <div className="generated-image-card my-3 image-skeleton rounded-2xl overflow-hidden border border-white/10 max-w-full">
      <div className="aspect-[4/3] sm:aspect-[16/10] w-full max-h-[420px] flex flex-col items-center justify-center gap-4 p-8 bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
        <div className="h-12 w-12 rounded-xl bg-white/10 animate-pulse border border-white/10 grid place-items-center text-white/40">✦</div>
        <div className="h-2 w-32 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-1/2 bg-white/20 rounded-full animate-[shimmerSlide_1.2s_ease_infinite]" />
        </div>
        <div className="flex items-center gap-1 text-xs tracking-wide" style={{ color: "var(--muted)" }}>
          <span>{display}</span><span className="w-4 text-left">{dots}</span>
        </div>
        <div className="text-[11px] text-white/30">VISION image generation • {phase === 0 ? "composing" : "rendering"}</div>
      </div>
      <div className="h-10 bg-white/[0.02] border-t border-white/5 flex items-center px-3 gap-2">
        <div className="h-6 w-20 rounded-full bg-white/10 skeleton" />
        <div className="h-6 w-16 rounded-full bg-white/5 skeleton" />
      </div>
    </div>
  );
}

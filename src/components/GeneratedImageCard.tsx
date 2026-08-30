"use client";
import React, { useState } from "react";

export default function GeneratedImageCard({ src, alt = "Generated image", prompt }: { src: string; alt?: string; prompt?: string }) {
  const [viewer, setViewer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleDownload = async () => {
    const filename = `vision-generated-image-${new Date().toISOString().slice(0,10)}.png`;
    // Try to fetch original blob to preserve quality; fallback to direct link for CORS cases
    try {
      const resp = await fetch(src, { mode: "cors" });
      if (!resp.ok) throw new Error("fetch failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    } catch {}
    // Fallback: direct download via anchor (preserves original URL quality, no recompression)
    try {
      const a = document.createElement("a");
      a.href = src;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.open(src, "_blank");
    }
  };

  const handleCopy = async () => {
    try {
      const resp = await fetch(src);
      const blob = await resp.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      try {
        await navigator.clipboard.writeText(src);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {}
    }
  };

  const handleRegenerate = () => {
    // Dispatch custom event that ChatView listens for
    window.dispatchEvent(new CustomEvent("vision:regenerate-image", { detail: { prompt, src } }));
  };

  if (imgError) {
    return (
      <div className="generated-image-card p-4 flex flex-col items-center justify-center gap-2 py-8">
        <span className="text-lg">⚠</span>
        <span className="text-xs text-white/50">Couldn't load image</span>
        <a href={src} target="_blank" rel="noopener" className="text-xs underline text-emerald-300">Open original</a>
      </div>
    );
  }

  return (
    <>
      <div className="generated-image-card my-3 max-w-full">
        <div className="relative group">
          <img
            src={src}
            alt={alt}
            onClick={() => setViewer(true)}
            onError={() => setImgError(true)}
            className="w-full h-auto max-h-[520px] object-contain bg-black cursor-zoom-in"
            style={{ maxWidth: "100%" }}
            loading="lazy"
          />
          <button
            onClick={() => setViewer(true)}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 backdrop-blur grid place-items-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
            aria-label="Expand"
          >
            ⛶
          </button>
        </div>
        {prompt && <div className="px-3 py-2 text-xs text-white/40 border-t border-white/5 truncate">Prompt: {prompt}</div>}
        <div className="flex flex-wrap gap-1.5 px-3 py-2.5 bg-white/[0.02] border-t border-white/5">
          <button onClick={() => setViewer(true)} className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium hover:bg-white/90">⛶ Full size</button>
          <button onClick={handleDownload} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs hover:bg-white/15 text-white">⬇ Download</button>
          <button onClick={handleCopy} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs hover:bg-white/15 text-white">{copied ? "Copied ✓" : "⎘ Copy"}</button>
          <button onClick={handleRegenerate} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs hover:bg-white/15 text-white">↻ Regenerate</button>
        </div>
      </div>
      {viewer && (
        <div onClick={() => setViewer(false)} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <img src={src} alt={alt} className="max-w-[92vw] max-h-[92vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          <button aria-label="Close" onClick={() => setViewer(false)} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white text-black grid place-items-center text-lg leading-none">×</button>
        </div>
      )}
    </>
  );
}

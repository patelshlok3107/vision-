"use client";
import { useState } from "react";

export default function ScreenCaptureButton({ onCaptured, disabled }: { onCaptured: (file: File)=>void, disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    if (busy || disabled) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Screen capture not supported in this browser. Use Chrome/Edge and HTTPS.");
      return;
    }
    setBusy(true);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" } as any, audio: false });
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      // Create video element to capture frame
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      // Wait a bit for frame
      await new Promise(r => setTimeout(r, 300));
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      // Downscale if huge (max 2048 per backend VISION_MAX_IMAGE_DIMENSION)
      const maxDim = 2048;
      let cw = w, ch = h;
      if (Math.max(w, h) > maxDim) {
        const scale = maxDim / Math.max(w, h);
        cw = Math.round(w * scale);
        ch = Math.round(h * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, cw, ch);
      // Stop stream
      stream.getTracks().forEach(t => t.stop());
      stream = null;
      const blob: Blob | null = await new Promise(res => canvas.toBlob(b => res(b), "image/png", 0.92));
      if (!blob) throw new Error("Failed to capture");
      const file = new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" });
      onCaptured(file);
    } catch (e: any) {
      if (e?.name !== "NotAllowedError") alert(`Capture failed: ${e.message || e}`);
    } finally {
      if (stream) stream.getTracks().forEach(t => t.stop());
      setBusy(false);
    }
  };
  return (
    <button onClick={handle} disabled={busy || disabled} title="See My Screen — capture and analyze" className="h-9 w-9 rounded-full bg-white/5 border border-white/10 grid place-items-center hover:bg-white hover:text-black disabled:opacity-40 text-sm">
      {busy ? "◎" : "◉"}
    </button>
  );
}

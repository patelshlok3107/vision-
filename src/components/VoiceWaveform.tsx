"use client";
export default function VoiceWaveform({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex items-center gap-1 h-4" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="w-1 bg-white/70 rounded-full animate-pulse"
          style={{
            height: active ? `${6 + Math.abs(Math.sin(Date.now()/200 + i))*14}px` : "6px",
            animationDelay: `${i * 60}ms`,
            animationDuration: "520ms",
          }}
        />
      ))}
      <span className="ml-2 text-xs text-white/50">Listening...</span>
    </div>
  );
}

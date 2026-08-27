"use client";

type Props = {
  isListening: boolean;
  state: string;
  onToggle: () => void;
  size?: number;
};

export default function VoiceMicButton({ isListening, state, onToggle, size = 44 }: Props) {
  const isError = state === "error";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
      title={isListening ? "Stop (listening…)" : "Voice input (Ctrl+Shift+V)"}
      className={`relative inline-flex items-center justify-center rounded-full border transition shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
        ${isListening ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.35)]" : isError ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-white/70 border-white/10 hover:bg-white hover:text-black hover:border-white"}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {isListening && <span className="absolute inset-0 rounded-full animate-ping bg-white/20" aria-hidden />}
      <span className="relative text-sm" aria-hidden>
        {isError ? "⚠" : isListening ? "●" : "🎙"}
      </span>
    </button>
  );
}

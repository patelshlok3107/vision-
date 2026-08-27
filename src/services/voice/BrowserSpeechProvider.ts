"use client";
import type { SpeechRecognitionProvider } from "./types";

type SRConstructor = new () => any;

function getSR(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w: any = window;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export class BrowserSpeechProvider implements SpeechRecognitionProvider {
  supported: boolean;
  private rec: any | null = null;
  onResult: (t: string, isFinal: boolean) => void = () => {};
  onEnd: () => void = () => {};
  onError: (code: string, msg: string) => void = () => {};
  onStart: () => void = () => {};

  constructor() {
    this.supported = !!getSR();
  }

  start(lang: string = "en-US") {
    const Ctor = getSR();
    if (!Ctor) {
      this.onError("not-supported", "Speech recognition not supported in this browser.");
      return;
    }
    // Ensure single session — abort previous
    try { this.rec?.abort(); } catch {}
    const r = new Ctor();
    this.rec = r;
    r.continuous = false;
    r.interimResults = true;
    r.lang = lang;
    r.maxAlternatives = 1;

    r.onstart = () => this.onStart();
    r.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) final += res[0].transcript + " ";
        else interim += res[0].transcript + " ";
      }
      if (final) this.onResult(final.trim(), true);
      else if (interim) this.onResult(interim.trim(), false);
    };
    r.onerror = (e: any) => {
      const code = e.error || "unknown";
      const map: Record<string, string> = {
        "not-allowed": "Microphone permission is blocked. Please allow microphone permission in your browser settings.",
        "service-not-allowed": "Microphone permission is blocked.",
        "audio-capture": "I couldn't access your microphone.",
        "no-speech": "I didn't hear anything. Try again.",
        "network": "Speech recognition is unavailable right now.",
        "aborted": "Recording stopped.",
      };
      this.onError(code, map[code] || e.message || "Speech recognition error.");
    };
    r.onend = () => {
      this.onEnd();
    };
    try { r.start(); } catch (err: any) {
      this.onError("aborted", err?.message || "Failed to start recognition.");
    }
  }

  stop() {
    try { this.rec?.stop(); } catch {}
  }
  abort() {
    try { this.rec?.abort(); } catch {}
  }
}

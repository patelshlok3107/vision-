"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserSpeechProvider } from "@/services/voice/BrowserSpeechProvider";
import type { VoiceState } from "@/services/voice/types";

const MAX_DURATION_MS = 30_000;
const SILENCE_TIMEOUT_MS = 6000;

export function useVoiceInput(opts?: { lang?: string; autoSend?: boolean }) {
  const lang = opts?.lang || "en-US";
  const providerRef = useRef<BrowserSpeechProvider | null>(null);
  if (!providerRef.current) providerRef.current = new BrowserSpeechProvider();

  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const maxTimer = useRef<any>(null);
  const silenceTimer = useRef<any>(null);

  const isListening = state === "listening";

  const clearTimers = () => {
    if (maxTimer.current) clearTimeout(maxTimer.current);
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
  };

  const checkSecureContext = () => {
    if (typeof window === "undefined") return true;
    const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    const isSecure = window.isSecureContext;
    if (!isSecure && !isLocalhost) {
      setError("Microphone requires HTTPS or localhost. Please use a secure context.");
      setState("error");
      return false;
    }
    return true;
  };

  const stop = useCallback(() => {
    clearTimers();
    providerRef.current?.stop();
    // onEnd will set processing -> idle after final transcript
  }, []);

  const start = useCallback(async () => {
    if (isListening) return; // single session guard
    setError(null);

    if (!checkSecureContext()) return;

    const provider = providerRef.current!;
    if (!provider.supported) {
      setIsSupported(false);
      setError("Speech recognition not supported in this browser.");
      setState("error");
      return;
    }

    // No pre-flight getUserMedia — SpeechRecognition triggers permission natively

    setTranscript("");
    setInterim("");
    setState("listening");

    provider.onStart = () => {
      setState("listening");
      // Max duration guard
      maxTimer.current = setTimeout(() => {
        provider.stop();
      }, MAX_DURATION_MS);
      // Silence guard
      silenceTimer.current = setTimeout(() => {
        if (!transcript && !interim) {
          setError("I didn't hear anything. Try again.");
          setState("error");
          provider.stop();
          setTimeout(() => setState("idle"), 1500);
        }
      }, SILENCE_TIMEOUT_MS);
    };

    provider.onResult = (t, isFinal) => {
      if (isFinal) {
        setTranscript(prev => (prev ? prev + " " + t : t).trim());
        setInterim("");
      } else {
        setInterim(t);
      }
      // reset silence timer on any interim
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
          // do nothing — let recognition end naturally
        }, 6000);
      }
    };

    provider.onError = (code, msg) => {
      clearTimers();
      setError(msg);
      setState("error");
      // Auto-reset error after 2.5s
      setTimeout(() => setState("idle"), 2500);
    };

    provider.onEnd = () => {
      clearTimers();
      setState(s => (s === "error" ? s : "idle"));
    };

    provider.start(lang);
  }, [lang, isListening, transcript, interim]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  const reset = useCallback(() => {
    clearTimers();
    setTranscript("");
    setInterim("");
    setError(null);
    setState("idle");
  }, []);

  // Cleanup on unmount / navigation — stop microphone, release listeners
  useEffect(() => {
    return () => {
      clearTimers();
      providerRef.current?.abort();
    };
  }, []);

  // Keyboard shortcut Ctrl+Shift+V / Cmd+Shift+V
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  return {
    state,
    isListening,
    isSupported,
    transcript,
    interim,
    displayText: transcript + (interim ? (transcript ? " " : "") + interim : ""),
    error,
    supported: providerRef.current?.supported ?? false,
    start,
    stop,
    toggle,
    reset,
  };
}

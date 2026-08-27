export type VoiceState = "idle" | "listening" | "processing" | "error";
export interface SpeechRecognitionProvider {
  supported: boolean;
  start(lang?: string): void;
  stop(): void;
  abort(): void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onEnd: () => void;
  onError: (code: string, message: string) => void;
  onStart: () => void;
}

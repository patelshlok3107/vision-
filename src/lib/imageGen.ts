import { apiUrl } from "@/lib/api";

export function isImageGenerationPrompt(text: string, hasImage = false): boolean {
  if (!text) return false;
  const low = text.toLowerCase().trim();
  if (hasImage) {
    if (["what's in", "what is in", "analyze this", "describe this"].some(k => low.includes(k))) return false;
    if (["create", "generate", "make", "variation", "similar", "edit", "change", "remove background"].some(k => low.includes(k))) return true;
  }
  if (low.includes("create a website") || low.includes("build a website") || low.includes("ecommerce") || low.includes("e-commerce")) {
    if (!low.includes("generate image") && !low.includes("create image")) return false;
  }
  const phrases = ["generate image", "create image", "make image", "generate photo", "create photo", "generate picture", "realistic image", "cinematic image", "photorealistic"];
  for (const p of phrases) if (low.includes(p)) return true;
  const re = /\b(generate|create|make|draw|render)\b.*\b(image|photo|picture|portrait|illustration|landscape|scene)\b/i;
  if (re.test(low)) return true;
  if (/^(create|generate|make|draw)\s+(a\s+)?[a-z0-9 ]{2,40}\.?$/i.test(low) && !/function|component|api|page|app/.test(low) && low.length < 60) return true;
  return false;
}

export async function generateImage(prompt: string, opts?: { aspect_ratio?: string; conversation_id?: string; width?: number; height?: number }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || localStorage.getItem("access") || "" : "";
  const res = await fetch(apiUrl("/api/ai/generate-image/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ prompt, aspect_ratio: opts?.aspect_ratio, conversation_id: opts?.conversation_id, width: opts?.width, height: opts?.height }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(j.error || j.detail || "Image generation failed");
  }
  return (await res.json()) as { url: string; prompt_used: string; provider: string; width: number; height: number };
}

"use client";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import WebsitePreview from "./WebsitePreview";
import GeneratedImageCard from "./GeneratedImageCard";

/* ------------------------------------------------------------------ */
/*  UTF-8 / HTML entity sanitization                                  */
/*  Fixes mojibake like â -> –, â¢ -> •, raw <br>, &amp; etc      */
/* ------------------------------------------------------------------ */
const MOJIBAKE_MAP: Record<string, string> = {
  "â": "–", "â": "—", "â": "“", "â": "”", "â": "’", "â": "‘",
  "â¢": "•", "â¦": "…", "â": "≈", "â": "−", "â": "→", "â": "←",
  "Ã©": "é", "Ã¨": "è", "Ã´": "ô", "Ã¢": "â", "Ã": "à",
  "â¢": "™", "Â": "", "â¢": "•", "â¬": "€", "Â·": "·",
  // common double-encoded remnants
  "â": "–", "â": "—", "â": "’", "â": "“", "â": "”",
};

function decodeEntities(str: string): string {
  // lightweight entity decode without DOM
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

function fixMojibake(str: string): string {
  let out = str;
  // direct map replace
  for (const [bad, good] of Object.entries(MOJIBAKE_MAP)) {
    if (out.includes(bad)) out = out.split(bad).join(good);
  }
  // fix patterns like â¢, â that remain due to combining chars
  out = out.replace(/â[^\s]{1,3}/g, (m) => MOJIBAKE_MAP[m] ?? m);
  // Remove stray Â before unicode
  out = out.replace(/Â([\u00A0-\u00FF])/g, "$1");
  return out;
}

function sanitizeContent(raw: string): string {
  if (!raw) return raw;
  let s = raw;
  // 1. Fix mojibake first
  s = fixMojibake(s);
  // 2. Decode HTML entities (but preserve intentional markdown)
  // Only decode entities that look like encoding artifacts, not links
  // We decode &amp; etc but keep markdown images/links intact by decoding after
  s = s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  // 3. Replace raw <br> tags with markdown line breaks
  // Must do before ReactMarkdown - otherwise they'd be escaped and shown raw
  s = s.replace(/<br\s*\/?>/gi, "  \n");
  s = s.replace(/<\/br>/gi, "");
  // 4. Remove zero-width / control artifacts
  s = s.replace(/\uFFFD/g, "");
  // 5. Normalize excessive blank lines (more than 2 consecutive)
  s = s.replace(/\n{4,}/g, "\n\n\n");
  return s;
}

/* ------------------------------------------------------------------ */
/*  Code block + Mermaid                                              */
/* ------------------------------------------------------------------ */
function CodeBlock({ inline, className, children, ...props }: any) {
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const isMermaid = lang === "mermaid";
  const isHtml = lang === "html" || lang === "xml";
  const canPreview = isHtml && code.trim().length > 30;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { }
  };

  if (inline) {
    return <code className="px-1.5 py-0.5 rounded bg-white/10 text-emerald-200 text-sm break-words" {...props}>{children}</code>;
  }

  if (isMermaid) {
    return <MermaidBlock code={code} />;
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a] max-w-full">
      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.04] border-b border-white/10">
        <span className="text-xs font-mono text-white/50">{lang || "text"}</span>
        <div className="flex gap-2">
          {canPreview && (
            <button onClick={()=> setPreview(v=>!v)} className={`px-3 py-1 rounded-full border text-xs ${preview?"bg-white text-black border-white":"bg-white/10 border-white/10 hover:bg-white/20"}`}>
              {preview ? "Hide Preview" : "Preview"}
            </button>
          )}
          <button onClick={copy} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs hover:bg-white/20">
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      </div>
      <pre className="p-0 m-0 overflow-x-auto max-h-[600px] max-w-full">
        <code className={className} {...props} style={{ display: "block", padding: "1rem", background: "#0a0a0a", whiteSpace: "pre", wordBreak: "normal", overflowWrap: "normal" }}>{children}</code>
      </pre>
      {canPreview && preview && (
        <div className="border-t border-white/10 bg-white p-2">
          <div className="flex justify-between items-center px-2 py-1.5 text-xs" style={{color:"#6b7280"}}>
            <span>Preview • sandboxed</span>
            <div className="flex gap-1">
              <button onClick={()=> setPreview(false)} className="px-2 py-1 rounded-full bg-black text-white text-xs">Close</button>
            </div>
          </div>
          <iframe
            title="Preview"
            sandbox="allow-scripts"
            srcDoc={code}
            className="w-full h-[400px] rounded-lg border bg-white"
            style={{borderColor:"rgba(0,0,0,0.1)"}}
          />
        </div>
      )}
    </div>
  );
}

function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "dark", themeVariables: { primaryColor: "#fff" } });
        const id = `m-${Math.random().toString(36).slice(2, 8)}`;
        const { svg: s } = await mermaid.render(id, code);
        if (!cancelled) setSvg(s);
      } catch (e) {
        if (!cancelled) setSvg(`<pre style="color:#f87171">Mermaid error: ${String(e).slice(0, 300)}</pre>`);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);
  const copy = async () => {
    await navigator.clipboard.writeText("```mermaid\n" + code + "\n```");
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a] max-w-full">
      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.04] border-b border-white/10">
        <span className="text-xs font-mono text-white/50">mermaid</span>
        <div className="flex gap-2">
          <button onClick={copy} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs">{copied ? "Copied ✓" : "Copy"}</button>
          <button onClick={() => { const w = window.open(); if (w) w.document.write(`<div style="padding:20px;background:#0a0a0a;color:white">${svg}</div>`); }} className="px-3 py-1 rounded-full bg-white/10 text-xs">Fullscreen</button>
        </div>
      </div>
      <div ref={ref} className="p-4 bg-white rounded-b-xl overflow-auto max-w-full" dangerouslySetInnerHTML={{ __html: svg || `<div class="text-xs text-white/40">Rendering diagram...</div>` }} />
    </div>
  );
}

export default function MarkdownRenderer({ content, isStreaming = false }: { content: string, isStreaming?: boolean }) {
  const [showWebsitePreview, setShowWebsitePreview] = useState(false);
  const clean = sanitizeContent(content);

  if (isStreaming) {
    // Streaming: render as sanitized pre-wrap but also handle basic markdown bold via simple replace to avoid raw ** display
    // We keep it lightweight to avoid re-parsing on every token, but ensure wrapping & no overflow
    return (
      <div className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:font-medium prose-a:text-emerald-300 prose-strong:text-white prose-code:text-emerald-200 prose-pre:bg-transparent prose-pre:p-0 break-words overflow-hidden">
        <div className="whitespace-pre-wrap text-sm leading-relaxed break-words [overflow-wrap:anywhere]">{clean}</div>
      </div>
    );
  }

  // Extract blocks for unified preview - supports single html file with inline CSS/JS (preferred) or split blocks
  const htmlMatches = Array.from(clean.matchAll(/```html\n([\s\S]*?)```/gi)).map(m => m[1]);
  const cssMatches = Array.from(clean.matchAll(/```css\n([\s\S]*?)```/gi)).map(m => m[1]);
  const jsMatches = Array.from(clean.matchAll(/```(?:javascript|js)\n([\s\S]*?)```/gi)).map(m => m[1]);

  const hasWebProject = htmlMatches.length > 0 || cssMatches.length > 0 || (clean.includes("<!DOCTYPE") && clean.includes("html>")) || (clean.includes("<html") && htmlMatches.length === 0 && (cssMatches.length > 0 || jsMatches.length > 0));

  return (
    <div className="markdown-content prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:font-medium prose-a:text-emerald-300 prose-strong:text-white prose-code:text-emerald-200 prose-pre:bg-transparent prose-pre:p-0 break-words overflow-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: CodeBlock as any,
          pre: ({ children }) => <>{children}</>,
          h1: ({ children }) => <h1 className="text-xl font-semibold mt-6 mb-3 border-b border-white/10 pb-2 leading-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mt-6 mb-2 leading-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2 leading-snug">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-semibold mt-4 mb-2 uppercase tracking-wide text-white/80">{children}</h4>,
          p: ({ children }) => <p className="my-2 leading-relaxed break-words [overflow-wrap:anywhere]">{children}</p>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:text-emerald-200 underline break-words">{children}</a>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-white/20 pl-4 italic text-white/70 my-3 break-words">{children}</blockquote>,
          ul: ({ children }) => <ul className="list-disc list-outside ml-5 space-y-1 my-2 marker:text-white/40">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside ml-5 space-y-1 my-2 marker:text-white/40">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed break-words [overflow-wrap:anywhere]">{children}</li>,
          hr: () => <hr className="my-4 border-white/10" />,
          // Table - responsive wrapper with horizontal scroll, min widths, wrapping
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-white/10 max-w-full -mx-1 px-1">
              <table className="w-full text-sm border-collapse min-w-[520px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/[0.06]">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2.5 text-left font-semibold text-white text-xs uppercase tracking-wide whitespace-nowrap min-w-[130px] border-b border-white/10 align-bottom">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2.5 align-top text-white/80 text-sm leading-relaxed min-w-[130px] whitespace-normal break-words [overflow-wrap:anywhere] border-b border-white/5">{children}</td>,
          img: ({ src, alt }) => {
            if (!src) return null;
            // Detect generated images (pollinations, openai) -> use polished card
            const isGenerated = src.includes("pollinations") || src.includes("generated") || (alt && /generated/i.test(alt));
            if (isGenerated) {
              return <GeneratedImageCard src={src} alt={alt || "Generated image"} />;
            }
            return <img src={src} alt={alt || ""} className="rounded-xl border border-white/10 max-w-full h-auto my-3" loading="lazy" />;
          },
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-white/90">{children}</em>,
        }}
      >
        {clean}
      </ReactMarkdown>

      {hasWebProject && (
        <div className="mt-4 border-t border-white/10 pt-4 pb-2">
          <button
            onClick={() => setShowWebsitePreview(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <span>▶</span> Preview Website
          </button>
        </div>
      )}

      {showWebsitePreview && (
        <WebsitePreview
          html={htmlMatches.join('\n')}
          css={cssMatches.join('\n')}
          js={jsMatches.join('\n')}
          onClose={() => setShowWebsitePreview(false)}
        />
      )}
    </div>
  );
}

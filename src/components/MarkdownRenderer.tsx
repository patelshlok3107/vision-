"use client";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import WebsitePreview from "./WebsitePreview";

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
    return <code className="px-1.5 py-0.5 rounded bg-white/10 text-emerald-200 text-sm" {...props}>{children}</code>;
  }

  if (isMermaid) {
    return <MermaidBlock code={code} />;
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
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
      <pre className="p-0 m-0 overflow-auto max-h-[600px]">
        <code className={className} {...props} style={{ display: "block", padding: "1rem", background: "#0a0a0a" }}>{children}</code>
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
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.04] border-b border-white/10">
        <span className="text-xs font-mono text-white/50">mermaid</span>
        <div className="flex gap-2">
          <button onClick={copy} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs">{copied ? "Copied ✓" : "Copy"}</button>
          <button onClick={() => { const w = window.open(); if (w) w.document.write(`<div style="padding:20px;background:#0a0a0a;color:white">${svg}</div>`); }} className="px-3 py-1 rounded-full bg-white/10 text-xs">Fullscreen</button>
        </div>
      </div>
      <div ref={ref} className="p-4 bg-white rounded-b-xl overflow-auto" dangerouslySetInnerHTML={{ __html: svg || `<div class="text-xs text-white/40">Rendering diagram...</div>` }} />
    </div>
  );
}

export default function MarkdownRenderer({ content, isStreaming = false }: { content: string, isStreaming?: boolean }) {
  const [showWebsitePreview, setShowWebsitePreview] = useState(false);

  if (isStreaming) {
    return (
      <div className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:font-medium prose-a:text-emerald-300 prose-strong:text-white prose-code:text-emerald-200 prose-pre:bg-transparent prose-pre:p-0">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
      </div>
    );
  }

  // Extract blocks for unified preview - supports single html file with inline CSS/JS (preferred) or split blocks
  const htmlMatches = Array.from(content.matchAll(/```html\n([\s\S]*?)```/gi)).map(m => m[1]);
  const cssMatches = Array.from(content.matchAll(/```css\n([\s\S]*?)```/gi)).map(m => m[1]);
  const jsMatches = Array.from(content.matchAll(/```(?:javascript|js)\n([\s\S]*?)```/gi)).map(m => m[1]);

  const hasWebProject = htmlMatches.length > 0 || cssMatches.length > 0 || (content.includes("<!DOCTYPE") && content.includes("html>")) || (content.includes("<html") && htmlMatches.length === 0 && (cssMatches.length > 0 || jsMatches.length > 0));

  return (
    <div className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-headings:font-medium prose-a:text-emerald-300 prose-strong:text-white prose-code:text-emerald-200 prose-pre:bg-transparent prose-pre:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: CodeBlock as any,
          pre: ({ children }) => <>{children}</>,
          h1: ({ children }) => <h1 className="text-xl font-medium mt-6 mb-3 border-b border-white/10 pb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-medium mt-6 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-medium mt-4 mb-2">{children}</h3>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-white/20 pl-4 italic text-white/70 my-3">{children}</blockquote>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
        }}
      >
        {content}
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

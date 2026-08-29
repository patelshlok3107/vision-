"use client";
import React, { useState, useEffect, useRef } from "react";

interface WebsitePreviewProps {
  html: string;
  css: string;
  js: string;
  onClose: () => void;
}

export default function WebsitePreview({ html, css, js, onClose }: WebsitePreviewProps) {
  const [responsiveMode, setResponsiveMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [logs, setLogs] = useState<{ type: string; msg: string; id: number }[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refreshIframe(); }, [html, css, js]);

  const refreshIframe = () => {
    setLogs([{ type: "system", msg: "Preview refreshing...", id: Date.now() }]);

    const needsBuild = (html.includes("import React") || js.includes("import React")) && !html.includes("https://esm.sh");
    if (needsBuild) {
      setLogs(prev => [...prev, {
        type: "error",
        msg: "This looks like a framework project (React/Vite) that requires a build step. HTML preview may not work.",
        id: Date.now(),
      }]);
    }

    const reducedMotionStyle = `<style>@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }</style>`;

    const scriptLogger = `<script>
(function(){
  var send=function(t,a){try{var m=Array.from(a).map(function(x){return typeof x==='object'?JSON.stringify(x):String(x);}).join(' ');window.parent.postMessage({type:'CONSOLE_LOG',level:t,msg:m},'*');}catch(e){}};
  var ol=console.log;console.log=function(){ol.apply(console,arguments);send('log',arguments);};
  var ow=console.warn;console.warn=function(){ow.apply(console,arguments);send('warn',arguments);};
  var oe=console.error;console.error=function(){oe.apply(console,arguments);send('error',arguments);};
  window.onerror=function(m,u,l){send('error',[m,'at line',l]);return false;};
  window.addEventListener('unhandledrejection',function(e){send('error',['Unhandled rejection:',e.reason]);});
})();
</script>`;

    let srcDoc = html;
    const hasHtmlTag = srcDoc.toLowerCase().includes("<html");
    const hasHead = srcDoc.toLowerCase().includes("<head");
    const hasBody = srcDoc.toLowerCase().includes("<body");

    if (!hasHtmlTag) {
      // No html wrapper — treat html as body content, css/js will be injected
      srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${reducedMotionStyle}</head><body>${srcDoc}</body></html>`;
    } else {
      // Ensure viewport and reduced-motion are present
      if (!srcDoc.toLowerCase().includes("viewport")) {
        if (hasHead) {
          srcDoc = srcDoc.replace(/<head[^>]*>/i, (m) => `${m}<meta name="viewport" content="width=device-width,initial-scale=1">`);
        }
      }
      // Inject reduced motion style into head
      if (hasHead) {
        srcDoc = srcDoc.replace(/<\/head>/i, `${reducedMotionStyle}</head>`);
      } else if (hasHtmlTag) {
        // No head but has html — inject after <html>
        srcDoc = srcDoc.replace(/<html[^>]*>/i, (m) => `${m}<head>${reducedMotionStyle}</head>`);
      }
    }

    if (css) {
      const styleTag = `<style>${css}</style>`;
      if (srcDoc.toLowerCase().includes("</head>")) {
        srcDoc = srcDoc.replace(/<\/head>/i, `${styleTag}</head>`);
      } else {
        srcDoc = styleTag + srcDoc;
      }
    }

    const finalJs = js ? `<script>${js}<\/script>` : "";
    if (srcDoc.toLowerCase().includes("<head>")) {
      srcDoc = srcDoc.replace(/<head>/i, `<head>${scriptLogger}`);
    } else {
      srcDoc = scriptLogger + srcDoc;
    }
    if (finalJs) {
      if (srcDoc.toLowerCase().includes("</body>")) {
        srcDoc = srcDoc.replace(/<\/body>/i, `${finalJs}</body>`);
      } else {
        srcDoc = srcDoc + finalJs;
      }
    } else {
      // Even when no separate js, still need logger — already injected above
      // If srcDoc didn't have head, logger already added
    }

    if (iframeRef.current) {
      iframeRef.current.srcdoc = srcDoc;
    }
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "CONSOLE_LOG") {
        setLogs(prev => [...prev, { type: e.data.level as string, msg: e.data.msg as string, id: Date.now() + Math.random() }]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const getWidth = () => {
    if (responsiveMode === "mobile") return "375px";
    if (responsiveMode === "tablet") return "768px";
    return "100%";
  };

  const getHeight = () => {
    if (responsiveMode === "mobile") return "667px";
    if (responsiveMode === "tablet") return "1024px";
    return "100%";
  };

  const openFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    const w = window.open("", "_blank");
    if (w && iframeRef.current) {
      w.document.write(iframeRef.current.srcdoc);
      w.document.close();
    }
  };

  const tabCls = (mode: "desktop" | "tablet" | "mobile") =>
    `px-3 py-1.5 rounded-md text-xs transition-colors ${responsiveMode === mode ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80"}`;

  const logCls = (type: string) => {
    if (type === "error") return "p-2 rounded border bg-red-500/10 border-red-500/20 text-red-300";
    if (type === "warn") return "p-2 rounded border bg-amber-500/10 border-amber-500/20 text-amber-300";
    if (type === "system") return "p-2 rounded border border-transparent text-white/40";
    return "p-2 rounded border border-white/5 bg-white/5 text-emerald-300/80";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111113] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-emerald-300">Website Preview</div>
          <div className="flex items-center bg-[#1a1a1c] border border-white/10 rounded-lg p-1">
            <button onClick={() => setResponsiveMode("desktop")} className={tabCls("desktop")}>Desktop</button>
            <button onClick={() => setResponsiveMode("tablet")} className={tabCls("tablet")}>Tablet</button>
            <button onClick={() => setResponsiveMode("mobile")} className={tabCls("mobile")}>Mobile</button>
          </div>
          <button onClick={refreshIframe} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors flex items-center gap-2">
            <span>↻</span> Refresh
          </button>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" onClick={openFullscreen} className="text-xs underline text-white/50 hover:text-white">↗ Fullscreen</a>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg leading-none transition-colors">×</button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Iframe area */}
        <div className="flex-1 flex items-center justify-center bg-[#0d0d0d] overflow-auto p-4">
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
            style={{ width: getWidth(), height: getHeight() }}
          >
            <iframe
              ref={iframeRef}
              title="Website Preview"
              sandbox="allow-scripts allow-forms allow-modals"
              referrerPolicy="no-referrer"
              className="w-full h-full border-none bg-white"
            />
          </div>
        </div>

        {/* Console */}
        <div className="w-80 border-l border-white/10 bg-[#0a0a0a] flex flex-col shrink-0">
          <div className="px-4 py-2 bg-white/5 border-b border-white/10 text-xs font-medium text-white/60">
            Console
          </div>
          <div className="flex-1 overflow-auto p-3 font-mono text-[11px] space-y-2">
            {logs.map((log) => (
              <div key={log.id} className={logCls(log.type)}>
                {log.type === "error" && <span className="font-bold mr-1">✕</span>}
                {log.type === "warn" && <span className="font-bold mr-1">⚠</span>}
                {log.msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

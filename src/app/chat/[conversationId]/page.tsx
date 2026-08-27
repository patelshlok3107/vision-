"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import ChatHistorySidebar from "@/components/ChatHistorySidebar";
import ChatView from "@/components/ChatView";

export default function ChatConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (!drawer && touchStartX.current < 24 && dx > 60) { setDrawer(true); touchStartX.current = null; if (navigator.vibrate) navigator.vibrate(10); }
    else if (drawer && dx < -60) { setDrawer(false); touchStartX.current = null; }
  };
  const onTouchEnd = () => { touchStartX.current = null; };

  return (
    <div className="app-shell" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="hidden md:flex">
        <ChatHistorySidebar activeId={conversationId} onNewChat={()=>router.push("/chat")} />
      </div>
      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={()=>setDrawer(false)} />
          <div className="w-[300px] max-w-[82vw] h-full flex flex-col" style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--border)", paddingTop: "env(safe-area-inset-top)" }}><ChatHistorySidebar activeId={conversationId} onNewChat={()=>{setDrawer(false); router.push("/chat");}} /></div>
        </div>
      )}
      <div className="md:hidden fixed top-0 left-0 z-10 p-2" style={{ paddingTop: "max(8px, env(safe-area-inset-top))", paddingLeft: "max(8px, env(safe-area-inset-left))" }}>
        <button onClick={()=>{ setDrawer(true); if(navigator.vibrate) navigator.vibrate(8); }} className="px-3 py-2 rounded-full text-xs font-medium shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} aria-label="Open menu">☰ VISION</button>
      </div>
      <ChatView conversationId={conversationId} />
    </div>
  );
}

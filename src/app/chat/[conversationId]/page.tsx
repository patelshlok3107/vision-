"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import ChatHistorySidebar from "@/components/ChatHistorySidebar";
import ChatView from "@/components/ChatView";
import MobileDrawer from "@/components/MobileDrawer";
import Link from "next/link";

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
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)}>
        <div className="flex-1 overflow-hidden flex flex-col" onClick={(e)=>{ const t=e.target as HTMLElement; if(t.closest("a")) setDrawer(false); }}>
          <ChatHistorySidebar activeId={conversationId} onNewChat={()=>{setDrawer(false); router.push("/chat");}} />
        </div>
      </MobileDrawer>
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 mobile-header">
        <button onClick={()=>{ setDrawer(true); if(navigator.vibrate) navigator.vibrate(8); }} className="h-9 w-9 grid place-items-center rounded-full border text-sm shrink-0" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} aria-label="Open navigation menu">☰</button>
        <span className="text-sm font-medium tracking-widest">VISION</span>
        <Link href="/profile" aria-label="Profile" className="h-9 w-9 grid place-items-center rounded-full border text-xs" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>•</Link>
      </div>
      <div className="flex-1 min-w-0 flex flex-col pt-[calc(56px+env(safe-area-inset-top))] md:pt-0 overflow-hidden">
        <ChatView conversationId={conversationId} />
      </div>
    </div>
  );
}

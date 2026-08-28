"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import ChatHistorySidebar from "@/components/ChatHistorySidebar";
import ChatView from "@/components/ChatView";
import MobileDrawer from "@/components/MobileDrawer";
import Link from "next/link";

export default function ChatPage() {
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const handleNew = () => router.push("/chat");
  const touchStartX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (!drawer && touchStartX.current < 24 && dx > 60) {
      setDrawer(true);
      touchStartX.current = null;
      if (navigator.vibrate) navigator.vibrate(10);
    } else if (drawer && dx < -60) {
      setDrawer(false);
      touchStartX.current = null;
    }
  };
  const onTouchEnd = () => { touchStartX.current = null; };

  return (
    <div className="app-shell" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="hidden md:flex">
        <ChatHistorySidebar onNewChat={handleNew} />
      </div>
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)}>
        <div className="flex-1 overflow-hidden flex flex-col" onClick={(e) => {
          // Close drawer when navigating via links inside
          const target = e.target as HTMLElement;
          if (target.closest("a")) setDrawer(false);
        }}>
          <ChatHistorySidebar onNewChat={()=>{setDrawer(false); handleNew();}} />
        </div>
      </MobileDrawer>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 mobile-header" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <button onClick={()=>{ setDrawer(true); if(navigator.vibrate) navigator.vibrate(8); }} className="h-9 w-9 grid place-items-center rounded-full border text-sm shrink-0" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} aria-label="Open navigation menu">☰</button>
        <span className="text-sm font-medium tracking-widest">VISION</span>
        <Link href="/profile" aria-label="Profile" className="h-9 w-9 grid place-items-center rounded-full border text-xs" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>•</Link>
      </div>
      <div className="flex-1 min-w-0 flex flex-col pt-[calc(56px+env(safe-area-inset-top))] md:pt-0 overflow-hidden">
        <ChatView />
      </div>
    </div>
  );
}

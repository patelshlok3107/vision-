"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Vesper landing is single viewport for ALL users (guest + authenticated) — no auto-redirect
  // Authenticated users get CTA to /chat instead of #start

  // menu + animation fallback for Vesper landing
  useEffect(() => {
    if (loading) return;
    document.title = "VISION — Operational AI Infrastructure";
    const appears = document.querySelectorAll(".vesper .appear");
    const heroPhoto = document.querySelector(".vesper .hero-photo") as HTMLElement | null;
    const onEnd = (e: Event) => (e.target as HTMLElement).classList.add("is-in");
    appears.forEach((el) => el.addEventListener("animationend", onEnd as any, { once: true } as any));
    if (heroPhoto) heroPhoto.addEventListener("animationend", () => heroPhoto.classList.add("is-in"), { once: true } as any);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        let hasRunning = false;
        try {
          for (const el of Array.from(appears) as any[]) {
            const anims = el.getAnimations ? el.getAnimations() : [];
            for (const a of anims) if (a.playState === "running" || a.playState === "finished") { hasRunning = true; break; }
            if (hasRunning) break;
          }
          if (heroPhoto && (heroPhoto as any).getAnimations) {
            for (const a of (heroPhoto as any).getAnimations()) if (a.playState === "running" || a.playState === "finished") { hasRunning = true; break; }
          }
        } catch {}
        if (!hasRunning) {
          appears.forEach((el) => el.classList.add("is-in"));
          if (heroPhoto) heroPhoto.classList.add("is-in");
        }
      });
    });
    const burger = document.querySelector(".vesper .burger") as HTMLElement | null;
    const nav = document.getElementById("site-nav");
    const backdrop = document.getElementById("menu-backdrop");
    const closeMenu = () => {
      document.body.classList.remove("menu-open");
      if (burger) { burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Open menu"); }
    };
    const toggleMenu = () => {
      const open = document.body.classList.toggle("menu-open");
      if (burger) { burger.setAttribute("aria-expanded", String(open)); burger.setAttribute("aria-label", open ? "Close menu" : "Open menu"); }
    };
    if (burger) burger.addEventListener("click", toggleMenu);
    if (backdrop) backdrop.addEventListener("click", closeMenu);
    if (nav) nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeMenu(); };
    const onResize = () => { if (window.matchMedia("(min-width: 901px)").matches) closeMenu(); };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center" style={{ background: "#000", color: "#fff" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
          <div className="text-xs tracking-widest" style={{ color: "#9a9a9a" }}>LOADING</div>
        </div>
      </div>
    );
  }

  return (
    <div className="vesper" style={{ background: "#000", color: "#fff" } as any}>
      <style>{`
html, body { background: #000000 !important; color: #ffffff; }
@font-face { font-family: "Inter"; font-style: normal; font-weight: 100 900; font-display: swap; src: url("/inter.woff2") format("woff2"); }
@font-face { font-family: "Instrument Serif"; font-style: italic; font-weight: 400; font-display: swap; src: url("/instrument-serif-italic.woff2") format("woff2"); }
html, body { background: #000000; background: var(--bg, #000000); color: #ffffff; color: var(--text, #ffffff); }
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
.vesper{ -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; text-rendering:optimizeLegibility; overflow-x:hidden; position:relative; font-family:"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.vesper a{color:inherit;text-decoration:none}
.vesper button{font-family:inherit}
.vesper{ --bg:#000000; --text:#ffffff; --muted:#9a9a9a; --stat:#d8d8d8; --border:rgba(255,255,255,0.16); --border-soft:rgba(255,255,255,0.12); --logo:15.5px; --logo-mark:22px; --nav:14px; --nav-h:40px; --btn:13.5px; --btn-h:40px; --hero-btn-h:42px; --h1:48px; --lede:15.5px; --badge:12.5px; --stat-size:13.5px; --header-y:22px; --header-x:40px; --stats-x:72px; --stats-y:36px; --hero-gap:85px; --copy-max:860px; --lede-max:470px; }
.vesper .hero-photo{position:fixed;inset:0;z-index:0;overflow:hidden;background:#000}
.vesper .hero-photo video{width:100%;height:100%;object-fit:cover;opacity:1;display:block}
.vesper .hero-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%);pointer-events:none}
.vesper .page{position:relative;z-index:1;display:grid;grid-template-rows:auto 1fr auto;min-height:100vh;min-height:100dvh}
.vesper .grain{position:fixed;inset:0;z-index:100;pointer-events:none;opacity:0.035;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")}
.vesper .header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:var(--header-y) var(--header-x) 10px;z-index:50;position:relative}
.vesper .logo{display:inline-flex;align-items:center;gap:9px;justify-self:start;font-size:var(--logo);font-weight:600;letter-spacing:-0.03em;color:#fff;font-family:"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif}
.vesper .logo-suffix{font-weight:400}
.vesper .logo svg{width:var(--logo-mark);height:var(--logo-mark);flex-shrink:0}
.vesper #site-nav{display:flex;align-items:center;gap:8px;justify-self:center}
.vesper #site-nav a{height:var(--nav-h);padding:0 18px;border-radius:7px;overflow:hidden;position:relative;border:1px solid rgba(198,198,198,0.55);background:linear-gradient(105deg, #050505 0%, #2a2a2a 48%, #4a4a4a 100%);color:#f3f3f3;font-size:var(--nav);font-weight:400;letter-spacing:-0.01em;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;transition:background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease}
.vesper #site-nav a::before{content:"";position:absolute;inset:0;background:linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.16) 50%, transparent 70%);transform:translateX(-120%);transition:transform 0.6s ease}
.vesper #site-nav a:hover::before{transform:translateX(120%)}
.vesper #site-nav a:hover{border-color:rgba(235,235,235,0.9);background:linear-gradient(105deg, #111 0%, #3a3a3a 45%, #6a6a6a 100%);box-shadow:0 0 18px rgba(200,210,230,0.18)}
.vesper .header-cta{justify-self:end}
.vesper .btn{position:relative;isolation:isolate;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;height:var(--btn-h);padding:0 16px;border-radius:6px;font-size:var(--btn);font-weight:500;letter-spacing:-0.02em;line-height:1;white-space:nowrap;cursor:pointer;transition:background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, color 0.35s ease, filter 0.35s ease;text-decoration:none;border:1px solid transparent}
.vesper .btn::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.45) 48%, transparent 76%);transform:translateX(-130%);transition:transform 0.65s ease;pointer-events:none}
.vesper .btn:hover::after{transform:translateX(130%)}
.vesper .btn-solid{background:linear-gradient(180deg, #ffffff 0%, #e7e7e7 48%, #cfcfcf 100%);color:#111;border:1px solid #fff;box-shadow:inset 0 1px 0 rgba(255,255,255,0.95)}
.vesper .btn-solid:hover{background:linear-gradient(180deg, #fff 0%, #f3f6ff 42%, #d5def2 100%);border-color:#f2f6ff;box-shadow:inset 0 1px 0 #fff, 0 0 22px rgba(186,208,255,0.35), 0 8px 18px rgba(255,255,255,0.12)}
.vesper .hero .btn-solid:hover{box-shadow:inset 0 1px 0 #fff, 0 0 26px rgba(186,208,255,0.4), 0 8px 18px rgba(255,255,255,0.14)}
.vesper .btn-ghost{background:linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.45) 50%, rgba(160,175,200,0.08));color:#fff;border:1px solid rgba(198,198,198,0.45);box-shadow:inset 0 1px 0 rgba(255,255,255,0.12)}
.vesper .btn-ghost:hover{background:linear-gradient(135deg, rgba(210,225,255,0.18), rgba(0,0,0,0.35) 48%, rgba(180,195,220,0.16));border-color:rgba(220,230,255,0.75);box-shadow:inset 0 1px 0 rgba(255,255,255,0.22), 0 0 20px rgba(170,200,255,0.22)}
.vesper .hero .btn-ghost{background:linear-gradient(135deg, rgba(255,255,255,0.12), rgba(0,0,0,0.5) 46%, rgba(150,170,200,0.1));border:1px solid rgba(198,198,198,0.55);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.vesper .hero .btn-ghost:hover{border-color:rgba(220,230,255,0.8);box-shadow:inset 0 1px 0 rgba(255,255,255,0.22), 0 0 24px rgba(170,200,255,0.28)}
.vesper .hero .btn{height:var(--hero-btn-h);padding:0 18px}
.vesper .burger{display:none;width:42px;height:42px;border-radius:6px;border:1px solid var(--border);background:rgba(8,8,8,0.55);z-index:60;cursor:pointer;place-items:center}
.vesper .burger span{display:block;width:16px;height:1.5px;background:#fff;border-radius:1px;transition:transform 0.25s ease, opacity 0.2s ease}
.vesper .burger span + span{margin-top:5px}
.vesper .burger:hover{border-color:rgba(255,255,255,0.32);background:rgba(255,255,255,0.05)}
body.menu-open .vesper .burger span:nth-child(1){transform:translateY(6.5px) rotate(45deg)}
body.menu-open .vesper .burger span:nth-child(2){opacity:0}
body.menu-open .vesper .burger span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}
.vesper .menu-backdrop{display:block;position:fixed;inset:0;z-index:40;background:rgba(8,8,8,0.42);opacity:0;visibility:hidden;transition:opacity 0.28s ease, visibility 0.28s ease}
body.menu-open .vesper .menu-backdrop{opacity:1;visibility:visible;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
.vesper .hero{display:flex;align-items:flex-end;justify-content:center;padding:8px 24px var(--hero-gap);min-height:0;text-align:center}
.vesper .hero-copy{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;text-align:center;max-width:var(--copy-max);width:100%}
.vesper .badge{display:inline-flex;align-items:center;gap:8px;margin-bottom:22px;padding:9px 15px;border:0;border-radius:5px;background:linear-gradient(90deg, #7d7d7d 0%, #2a2a2a 52%, #0a0a0a 100%);color:#f2f2f2;font-size:var(--badge);font-weight:400;letter-spacing:-0.01em;font-family:"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif}
.vesper .badge-star{width:18px;height:20px;flex-shrink:0;filter:drop-shadow(0 0 3px rgba(255,255,255,0.45));display:inline-block}
.vesper .hero h1{display:flex;flex-direction:column;align-items:center;font-family:"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;font-weight:500;letter-spacing:-0.045em;line-height:1.12;color:#fff;font-size:var(--h1);text-align:center}
.vesper .headline-line{display:block;overflow:hidden;padding:0.06em 0.15em 0.14em}
.vesper .hero h1 em{font-family:"Instrument Serif", "Times New Roman", Times, serif;font-style:italic;font-weight:400;font-size:1.08em;letter-spacing:-0.03em;color:#9a9a9a}
.vesper .lede{max-width:var(--lede-max);margin-top:18px;color:#9a9a9a;font-size:var(--lede);font-weight:400;line-height:1.55;letter-spacing:-0.015em;font-family:"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif}
.vesper .hero-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;margin-top:26px}
.vesper .stats{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:0 var(--stats-x) var(--stats-y);padding-bottom:max(var(--stats-y), env(safe-area-inset-bottom));color:var(--stat)}
.vesper .stat{display:inline-flex;align-items:center;gap:14px;font-size:var(--stat-size);letter-spacing:-0.015em;white-space:nowrap;font-family:"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;color:var(--stat)}
.vesper .stat svg{width:20px;height:20px;flex-shrink:0}
.vesper .stat-icon-wide{width:38px;height:21px}
.vesper .stat svg{color:#e8e8e8}
.vesper .appear{opacity:1;animation-duration:1.05s;animation-fill-mode:both;animation-timing-function:cubic-bezier(0.16,1,0.3,1);animation-delay:var(--d, 0.08s)}
.vesper .appear--scale{animation-name:in-scale}
.vesper .appear--soft{animation-name:in-soft}
.vesper .appear--mask{animation-name:in-mask}
.vesper .appear--pop{animation-name:in-pop}
.vesper .appear--btn{animation-name:in-btn}
.vesper .appear--side{animation-name:in-side}
.vesper .appear--stat{animation-name:in-stat}
.vesper .appear.is-in{animation:none;opacity:1;transform:none;clip-path:none;filter:none}
.vesper .hero-photo{animation:in-soft 1.2s cubic-bezier(0.16,1,0.3,1) both}
.vesper .hero-photo.is-in{animation:none;opacity:1;transform:none}
@keyframes in-scale{from{opacity:0;transform:scale(0.84)}to{opacity:1;transform:scale(1)}}
@keyframes in-soft{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes in-mask{from{opacity:0;transform:translateY(40%)}to{opacity:1;transform:translateY(0)}}
@keyframes in-pop{0%{opacity:0;transform:scale(0.9)}70%{opacity:1;transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
@keyframes in-btn{from{opacity:0;transform:translateY(18px) scale(0.94)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes in-side{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:translateX(0)}}
@keyframes in-stat{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.vesper .badge-star{animation:in-star 0.9s cubic-bezier(0.16,1,0.3,1) both;animation-delay:0.28s}
@keyframes in-star{0%{transform:scale(0.2) rotate(-50deg);opacity:0}65%{transform:scale(1.2) rotate(8deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
.vesper .hero h1 em{animation:in-em 1.2s ease both;animation-delay:0.72s}
@keyframes in-em{from{opacity:0.35;filter:blur(4px)}to{opacity:1;filter:blur(0)}}
@media (prefers-reduced-motion:reduce){ .vesper *,.vesper *::before,.vesper *::after{transition:none !important;animation:none !important} .vesper .appear,.vesper .hero-photo,.vesper .hero h1 em,.vesper .badge-star{opacity:1;transform:none;clip-path:none;filter:none} }
@media (min-width:1600px){ .vesper{--logo:17px;--logo-mark:24px;--nav:15px;--nav-h:44px;--btn:15px;--btn-h:44px;--hero-btn-h:48px;--h1:64px;--lede:18px;--badge:13.5px;--stat-size:15px;--header-y:28px;--header-x:64px;--stats-x:96px;--stats-y:44px;--copy-max:980px;--lede-max:540px} .vesper #site-nav{gap:10px} .vesper #site-nav a{padding:0 20px} .vesper .badge{margin-bottom:26px} .vesper .lede{margin-top:22px} .vesper .hero-actions{margin-top:30px;gap:12px} .vesper .stat svg{width:22px;height:22px} .vesper .stat-icon-wide{width:45px;height:24px} }
@media (min-width:1920px){ .vesper{--logo:18px;--logo-mark:26px;--nav:16px;--nav-h:48px;--btn:16px;--btn-h:48px;--hero-btn-h:52px;--h1:76px;--lede:20px;--badge:14.5px;--stat-size:16px;--header-y:32px;--header-x:80px;--stats-x:120px;--stats-y:52px;--copy-max:1120px;--lede-max:620px} .vesper #site-nav{gap:10px} .vesper #site-nav a{padding:0 22px} .vesper .btn{padding:0 22px} .vesper .badge{padding:10px 15px} .vesper .stat-icon-wide{width:48px;height:26px} }
@media (min-width:2560px){ .vesper{--h1:88px;--lede:22px;--header-x:120px;--stats-x:160px;--copy-max:1280px;--lede-max:680px} }
@media (min-width:1280px) and (max-width:1599px){ .vesper{--h1:54px;--lede:16px;--header-x:48px;--stats-x:80px;--copy-max:900px} }
@media (min-width:901px) and (max-width:1279px){ .vesper{--logo:15px;--nav:13px;--nav-h:36px;--btn:13px;--btn-h:38px;--hero-btn-h:40px;--h1:42px;--lede:15px;--badge:12px;--stat-size:12.5px;--header-y:16px;--header-x:28px;--stats-x:36px;--stats-y:28px;--hero-gap:64px;--copy-max:760px;--lede-max:440px} .vesper #site-nav a{padding:0 14px} .vesper .badge{margin-bottom:16px} .vesper .lede{margin-top:14px} .vesper .hero-actions{margin-top:20px} }
@media (min-width:901px) and (max-height:850px){ .vesper{--header-y:14px;--stats-y:24px;--hero-gap:48px;--h1:40px} .vesper .badge{margin-bottom:12px} .vesper .lede{margin-top:12px} .vesper .hero-actions{margin-top:16px} }
@media (min-width:901px) and (max-height:720px){ .vesper{--h1:34px;--lede:14px;--hero-gap:32px;--stats-y:18px;--nav-h:30px;--btn-h:34px;--hero-btn-h:36px} .vesper .badge{margin-bottom:8px} }
@media (min-width:901px){ html,body{height:100%;overflow:hidden} .vesper .page{height:100vh;height:100dvh;overflow:hidden} }
@media (max-width:900px){ html,body{height:auto;overflow-y:auto} .vesper .header{grid-template-columns:1fr auto auto;gap:8px;padding:16px 18px 10px;padding-top:max(16px, env(safe-area-inset-top));padding-left:max(18px, env(safe-area-inset-left));padding-right:max(18px, env(safe-area-inset-right))} .vesper .logo,.vesper .header-cta,.vesper .burger{z-index:80} .vesper .burger{display:grid} .vesper #site-nav{position:fixed;inset:0;z-index:45;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:96px 22px 32px;padding-top:max(96px, calc(env(safe-area-inset-top) + 88px));background:transparent;opacity:0;visibility:hidden;pointer-events:none;transition:opacity 0.28s ease, visibility 0.28s ease} body.menu-open .vesper #site-nav{opacity:1;visibility:visible;pointer-events:auto} .vesper #site-nav a{width:100%;height:56px;font-size:19px;border-radius:10px;justify-content:center} .vesper .hero{padding:20px 20px 64px} .vesper .stats{flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:0 20px 28px;white-space:normal;text-align:center} .vesper .stat{white-space:normal} .vesper .hero-copy,.vesper .lede{max-width:100%} .vesper{--logo:16px;--btn:15px;--btn-h:46px;--hero-btn-h:48px;--h1:36px;--lede:16.5px;--badge:13.5px;--stat-size:15px;--header-y:16px;--header-x:18px;--stats-x:20px;--stats-y:28px;--hero-gap:36px} }
@media (max-width:560px){ .vesper{--h1:34px;--lede:16px;--header-x:16px} .vesper .hero-actions{flex-direction:column;width:100%} .vesper .hero-actions .btn{width:100%} }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet" />
      <div className="grain" aria-hidden="true" />
      <div className="hero-photo" aria-hidden="true">
        <video autoPlay muted loop playsInline preload="auto">
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260818_072341_50851634-bbc3-4c33-9acc-7647d4db44aa.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="page">
        <div className="menu-backdrop" id="menu-backdrop" aria-hidden="true" />
        <header className="header">
          <a className="logo appear appear--scale" href="#top" aria-label="VISION" style={{ ["--d" as any]: "0.08s" }}>
            <svg viewBox="0 0 100 88" fill="none" aria-hidden="true" style={{ width: "var(--logo-mark)", height: "var(--logo-mark)" }}><path d="M 9 10 C 6 6, 12 3, 17 6.5 L 42.5 66.5 C 44.2 70.2, 46.5 73.2, 50 73.2 C 53.5 73.2, 55.8 70.2, 57.5 66.5 L 83 6.5 C 88 3, 94 6, 91 10 L 90.5 14.5 L 62 84.2 C 58.5 91.5, 53.2 88.8, 50 88.8 C 46.8 88.8, 41.5 91.5, 38 84.2 L 9.5 14.5 Z" fill="currentColor"/><circle cx="50" cy="38.5" r="11.5" fill="currentColor"/><circle cx="46.2" cy="34.8" r="4.2" fill="#000"/></svg>
            VISION
          </a>
          <nav id="site-nav" aria-label="Primary">
            <a className="appear appear--scale" href="#benefits" style={{ ["--d" as any]: "0.16s" }}>Benefits</a>
            <a className="appear appear--soft" href="#how-it-works" style={{ ["--d" as any]: "0.28s" }}>How It Works</a>
            <a className="appear appear--scale" href="#faqs" style={{ ["--d" as any]: "0.40s" }}>FAQs</a>
            <a className="appear appear--soft" href="#pricing" style={{ ["--d" as any]: "0.52s" }}>Pricing</a>
          </nav>
          <a className="btn btn-solid header-cta appear appear--scale" href={isAuthenticated ? "/chat" : "/register"} style={{ ["--d" as any]: "0.34s" }}>{isAuthenticated ? "Open Workspace" : "Start for Free"}</a>
          <button className="burger appear appear--scale" type="button" aria-controls="site-nav" aria-expanded="false" aria-label="Open menu" style={{ ["--d" as any]: "0.34s" }}>
            <span></span><span></span><span></span>
          </button>
        </header>
        <main className="hero" id="top">
          <div className="hero-copy">
            <div className="badge appear appear--pop" style={{ ["--d" as any]: "0.22s" }}>
              <svg className="badge-star" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" /></svg>
              Operational AI Infrastructure
            </div>
            <h1>
              <span className="headline-line appear appear--mask" style={{ ["--d" as any]: "0.42s" }}><span>Train <em>AI agents</em> on your</span></span>
              <span className="headline-line appear appear--mask" style={{ ["--d" as any]: "0.62s" }}><span>workflows in minutes.</span></span>
            </h1>
            <p className="lede appear appear--soft" style={{ ["--d" as any]: "0.82s" }}>Deploy adaptive AI agents that learn, execute, and scale operational tasks across your business.</p>
            <div className="hero-actions">
              <a className="btn btn-solid appear appear--btn" href={isAuthenticated ? "/chat" : "/register"} style={{ ["--d" as any]: "0.96s" }}>{isAuthenticated ? "Open Workspace" : "Start for Free"}</a>
              <a className="btn btn-ghost appear appear--side" href={isAuthenticated ? "/chat" : "#demo"} style={{ ["--d" as any]: "1.10s" }}>{isAuthenticated ? "Go to Chat" : "See it in action"}</a>
            </div>
          </div>
        </main>
        <footer className="stats">
          <div className="stat appear appear--stat" style={{ ["--d" as any]: "1.12s" }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g1" x1="3" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" /><stop offset="62%" stopColor="#3a3a3a" stopOpacity="0.62" /></linearGradient><linearGradient id="g2" x1="14" y1="2" x2="3" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#3a3a3a" stopOpacity="0.38" /><stop offset="62%" stopColor="#ffffff" stopOpacity="0.62" /></linearGradient></defs><rect x="3.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#g1)" /><rect x="13.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#g2)" /><rect x="9.2" y="10.9" width="5.6" height="2.2" rx="1.1" fill="#4a4a4a" /></svg>
            4.2M+ workflows automated
          </div>
          <div className="stat appear appear--stat" style={{ ["--d" as any]: "1.28s" }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.4" y="2.4" width="19.2" height="19.2" rx="6.2" fill="#ffffff" /><path d="M12 7.1v7.4 M8.15 12.35L12 16.2l3.85-3.85" stroke="#111" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
            92% reduction in manual operations
          </div>
          <div className="stat appear appear--stat" style={{ ["--d" as any]: "1.44s" }}>
            <svg className="stat-icon-wide" viewBox="0 0 40 22" aria-hidden="true"><circle cx="10.2" cy="11" r="9.2" fill="#2b2b2b" /><ellipse cx="10.2" cy="12.1" rx="4.15" ry="3.7" fill="#f4f4f4" /><path d="M6.2 8.2 L7.6 6.5 L8.9 8.2 Z M11.9 8.2 L13.3 6.5 L14.6 8.2 Z" fill="#f4f4f4" /><circle cx="8.6" cy="11.2" r="0.7" fill="#1a1a1a" /><circle cx="11.8" cy="11.2" r="0.7" fill="#1a1a1a" /><circle cx="20.2" cy="11" r="9.2" fill="#ffffff" /><circle cx="18.4" cy="10.2" r="1.7" fill="#111" /><circle cx="22" cy="10.2" r="1.7" fill="#111" /><ellipse cx="20.2" cy="13.2" rx="1.1" ry="0.65" fill="#111" /><path d="M18.6 14.8 Q20.2 16 21.8 14.8" stroke="#111" strokeWidth="1.2" fill="none" strokeLinecap="round" /><circle cx="30.2" cy="11" r="9.2" fill="#f26b1d" /><text x="30.2" y="15.1" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="12.5" fill="#fff">e</text></svg>
            180+ operational teams onboarded
          </div>
        </footer>
      </div>
    </div>
  );
}

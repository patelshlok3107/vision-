/* VISION Service Worker — v1.1.1 — cache app shell, offline fallback, push, update lifecycle */
const CACHE = "vision-cache-v1.1.1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = ["/", OFFLINE_URL, "/manifest.webmanifest", "/version.json"];

self.addEventListener("install", (event) => {
  // Do NOT skipWaiting automatically — wait for user to confirm update
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: "reload" }))))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Never cache version.json, API, version, health
  if (url.pathname === "/version.json" || url.pathname.startsWith("/api/") || url.pathname === "/version" || url.pathname === "/health" || url.pathname.startsWith("/health")) return;
  if (url.origin !== location.origin) return;

  // Don't intercept Next.js internals that need fresh network
  if (url.pathname.startsWith("/_next/") && req.headers.get("purpose") !== "prefetch") {
    // For _next static, use cache-first but bypass for data requests
    if (url.pathname.includes("/_next/data/") || url.searchParams.has("x-nextjs-data")) return;
  }

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: "no-store" });
        // Only cache successful HTML
        if (res.ok && res.headers.get("content-type")?.includes("text/html")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Try cached root for SPA fallback
        const root = await caches.match("/");
        if (root) return root;
        const offline = await caches.match(OFFLINE_URL);
        if (offline) return offline;
        return new Response("<h1>Offline</h1><p>VISION is offline.</p>", { status: 503, headers: { "Content-Type": "text/html" } });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res.ok && url.pathname.match(/\.(js|css|png|svg|woff2|webp|jpg|jpeg|gif|mp4)$/)) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    } catch {
      return cached || new Response("", { status: 504 });
    }
  })());
});

// Push notifications
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: event.data ? event.data.text() : "VISION", body: "" }; }
  const title = data.title || "VISION";
  const options = {
    body: data.body || data.message || "You have a new notification",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    data: { url: data.url || "/chat" },
    tag: data.tag || "vision-notif",
    renotify: false
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/chat";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) { if (w.url.includes(url) && "focus" in w) return w.focus(); }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

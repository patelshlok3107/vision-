/* VISION Service Worker — precache app shell, offline fallback, push notifications */
const CACHE = "vision-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = ["/", OFFLINE_URL, "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Skip non-GET, API, and chrome-extension
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return; // never cache API
  if (url.origin !== location.origin) return;

  // Navigation: network-first, fallback to cache/offline
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(async () => {
        const cached = await caches.match(req);
        return cached || caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Assets: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // cache static assets
        if (res.ok && (url.pathname.match(/\.(js|css|png|svg|woff2|webp|jpg|jpeg)$/))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
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

// Allow page to trigger skipWaiting
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

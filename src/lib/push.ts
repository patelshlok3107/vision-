"use client";
// Push subscription helpers — stores subscription in backend if authenticated, else local

function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function getVapidPublicKey(): Promise<string | null> {
  // Fetch from backend if available, else env
  try {
    const { apiUrl } = await import("@/lib/api");
    const res = await fetch(apiUrl("/api/push/vapid/"));
    if (res.ok) {
      const j = await res.json();
      return j.publicKey || null;
    }
  } catch {}
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

export async function subscribePush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  const vapid = await getVapidPublicKey();
  if (!vapid) {
    // Still allow local notifications without push, but return null
    return null;
  }
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapid) as any,
  });

  // Send to backend if authenticated
  try {
    const { apiUrl } = await import("@/lib/api");
    const token = localStorage.getItem("accessToken") || "";
    await fetch(apiUrl("/api/push/subscribe/"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(sub.toJSON()),
    });
  } catch {}
  // Also persist locally
  try { localStorage.setItem("vision_push_sub", JSON.stringify(sub.toJSON())); } catch {}
  return sub;
}

export async function unsubscribePush(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
  try {
    const { apiUrl } = await import("@/lib/api");
    const token = localStorage.getItem("accessToken") || "";
    await fetch(apiUrl("/api/push/unsubscribe/"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ endpoint: sub?.endpoint }),
    });
  } catch {}
  try { localStorage.removeItem("vision_push_sub"); } catch {}
  return true;
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// Local test notification (no server push)
export async function showLocalNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, { body, icon: "/icons/icon-192.png", badge: "/icons/icon-72.png" });
  } else {
    new Notification(title, { body });
  }
}

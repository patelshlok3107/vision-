import { NextResponse } from "next/server";
export async function POST() {
  // This would trigger web-push send using VAPID_PRIVATE_KEY on server.
  // Stub for Vercel — requires VAPID keys configured.
  return NextResponse.json({ ok: true, message: "Push test stub — configure VAPID keys and backend to send real pushes." });
}

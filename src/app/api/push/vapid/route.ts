import { NextResponse } from "next/server";

export async function GET() {
  // Public VAPID key — set via env, else return null so client uses local notifications only
  const key = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
  return NextResponse.json({ publicKey: key });
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const sub = await req.json();
    // In production this should store in DB keyed to user.
    // For now, just acknowledge — Vercel env may forward to real backend via rewrites.
    // If NEXT_PUBLIC_API_URL is external Django, frontend will hit Django directly, not this route.
    console.log("push subscribe", sub.endpoint?.slice(0, 40));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

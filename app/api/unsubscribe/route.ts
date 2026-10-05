import { NextRequest, NextResponse } from "next/server";
import { unsubscribe } from "@/lib/subscribers/store";

export const dynamic = "force-dynamic";

const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;
const CHANNELS = { email: "email", wa: "whatsapp" } as const;

/**
 * Turns off one channel for an unsubscribe token: `?t=<token>&c=email|wa`.
 * POST only. Mail clients send it for one-click unsubscribe (RFC 8058) and the /unsubscribe page sends it on load,
 * so a link scanner that prefetches the mail's links with GET can't unsubscribe anyone.
 */
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const channel = CHANNELS[(req.nextUrl.searchParams.get("c") ?? "email") as keyof typeof CHANNELS];
  if (!TOKEN_RE.test(token) || !channel) {
    return NextResponse.json({ success: false, message: "This unsubscribe link is not valid." }, { status: 400 });
  }

  try {
    const found = await unsubscribe(token, channel);
    if (!found) return NextResponse.json({ success: false, message: "This unsubscribe link is not valid." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/unsubscribe:", error);
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}

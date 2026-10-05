import { after, NextResponse } from "next/server";
import { parseSignup } from "@/lib/subscribers/signup";
import { recordSignup, releaseWelcome } from "@/lib/subscribers/store";
import { sendWelcomeEmail } from "@/lib/email/welcome";

/**
 * Subscribes an email, a WhatsApp number or both to IPO alerts, then sends the welcome mail after the response.
 * The reply depends only on what was submitted, never on who is already subscribed, so the endpoint can't be used to check.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseSignup(body);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message, success: false }, { status: 400 });
  }

  try {
    const welcome = await recordSignup(parsed.input);
    if (welcome) {
      after(async () => {
        const sent = await sendWelcomeEmail(welcome).catch((error) => {
          console.error("Welcome mail failed:", error);
          return false;
        });
        // A mail that didn't go out can go on the next signup instead of waiting out the resend window.
        if (!sent) await releaseWelcome(welcome.email).catch(() => {});
      });
    }

    const message = parsed.input.email
      ? "You're in. Check your inbox for a welcome email."
      : "You're in. IPO alerts will come to your WhatsApp.";
    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error("Error in /api/subscription:", error);
    return NextResponse.json({ message: "Something went wrong. Please try again.", success: false }, { status: 500 });
  }
}

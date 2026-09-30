import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";

interface Subscription {
  name?: string;
  email: string;
  is_newsletter_subscribed: boolean;
  is_whatsapp_subscribed: boolean;
  created_at: string;
  updated_at: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same reply for new, existing and returning subscribers, so the endpoint can't reveal who is subscribed.
const SUBSCRIBED = { message: "Subscribed. The next analysis lands in your inbox.", success: true };

/** Strings only, so a body like {"email": {"$ne": null}} can't become a Mongo operator. */
function isValidSignup(email: unknown, name: unknown): email is string {
  const validEmail = typeof email === "string" && email.length <= 254 && EMAIL_RE.test(email);
  const validName = name == null || (typeof name === "string" && name.length <= 100);
  return validEmail && validName;
}

/** Subscribes an email to the newsletter, creating the user_activity record if it is new. */
export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    if (!isValidSignup(email, name)) {
      return NextResponse.json({ message: "A valid email is required.", success: false }, { status: 400 });
    }

    const users = (await getDb()).collection<Subscription>("user_activity");
    const existingUser = await users.findOne({ email });
    const now = new Date().toISOString();

    if (!existingUser) {
      await users.insertOne({
        name,
        email,
        is_newsletter_subscribed: true,
        is_whatsapp_subscribed: false,
        created_at: now,
        updated_at: now,
      });
    } else if (!existingUser.is_newsletter_subscribed) {
      await users.updateOne(
        { email },
        { $set: { is_newsletter_subscribed: true, name: name || existingUser.name, updated_at: now } }
      );
    }

    return NextResponse.json(SUBSCRIBED);
  } catch (error) {
    console.error("Error in /api/subscription:", error);
    return NextResponse.json({ message: "Something went wrong.", success: false }, { status: 500 });
  }
}

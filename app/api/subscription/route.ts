import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

interface Subscription {
    name?: string;
    email: string;
    is_newsletter_subscribed: boolean;
    is_whatsapp_subscribed: boolean;
    created_at: string;
    updated_at: string;
}

/** Subscribes an email to the newsletter, creating the user_activity record if it is new. */
export async function POST(request: Request) {
    try {
        const db = await getDb();
        const { email, name } = await request.json();

        // A string check, or a JSON body like {"email": {"$ne": null}} becomes a Mongo operator.
        if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || (name != null && (typeof name !== "string" || name.length > 100))) {
            return NextResponse.json({ message: "A valid email is required.", success: false }, { status: 400 });
        }

        const users = db.collection<Subscription>("user_activity");
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
            return NextResponse.json({ message: "Thank you for subscribing to our newsletter!", success: true }, { status: 200 });
        }

        if (existingUser.is_newsletter_subscribed) {
            // Same reply as a new signup, so the endpoint can't be used to check who is subscribed.
            return NextResponse.json({ message: "Thank you for subscribing to our newsletter!", success: true }, { status: 200 });
        }

        await users.updateOne(
            { email },
            { $set: { is_newsletter_subscribed: true, name: name || existingUser.name, updated_at: now } }
        );
        return NextResponse.json({ message: "Thank you for subscribing to our newsletter!", success: true }, { status: 200 });
    } catch (error) {
        console.error("Error in /api/subscriptions:", error);
        return NextResponse.json({ message: "Something went wrong.", success: false }, { status: 500 });
    }
}

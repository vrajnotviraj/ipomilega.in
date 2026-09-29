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

        if (!email) {
            return NextResponse.json({ message: "Email is required.", success: false }, { status: 400 });
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
            return NextResponse.json({ message: "Thank you for subscribing to our newsletter!", success: true }, { status: 201 });
        }

        if (existingUser.is_newsletter_subscribed) {
            return NextResponse.json({ message: "You are already subscribed to our newsletter.", success: true }, { status: 200 });
        }

        await users.updateOne(
            { email },
            { $set: { is_newsletter_subscribed: true, name: name || existingUser.name, updated_at: now } }
        );
        return NextResponse.json({ message: "Successfully subscribed to the newsletter!", success: true }, { status: 200 });
    } catch (error) {
        console.error("Error in /api/subscriptions:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return NextResponse.json({ message: "Something went wrong.", error: errorMessage, success: false }, { status: 500 });
    }
}

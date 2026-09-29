import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { isAdminEmail } from "@/lib/auth-client";

let auth: ReturnType<typeof betterAuth> | undefined;

try {
  auth = betterAuth({
    database: mongodbAdapter(await getDb()),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      google: {
        prompt: "select_account",
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    user: {
      additionalFields: {
        // input: false stops a sign-up request from setting its own role.
        role: { type: "string", defaultValue: "user", input: false },
      },
    },
  });
} catch (error) {
  console.error("🔴 Failed to initialize database or authentication:", error);
}

export { auth };

/**
 * Null when the request carries a session for a verified admin email, otherwise the 401/403 to return.
 * Verified matters: email/password sign-up skips verification, so anyone could register an admin's address.
 */
export async function requireAdmin(req: Request) {
  const session = await auth?.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ success: false, message: "Sign in required" }, { status: 401 });
  }
  if (!session.user.emailVerified || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ success: false, message: "Admins only" }, { status: 403 });
  }
  return null;
}

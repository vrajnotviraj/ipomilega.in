import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getDb, closeConnection } from "@/lib/mongo";

let auth: unknown;

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
        role: { type: "string", defaultValue: "user" },
      },
    },
  });
} catch (error) {
  console.error("🔴 Failed to initialize database or authentication:", error);
}

export { auth };

process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received. Closing MongoDB connection.");
  await closeConnection();
});

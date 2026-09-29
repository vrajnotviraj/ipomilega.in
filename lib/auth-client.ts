import { createAuthClient } from "better-auth/react"

// Some hosts define a non-functional global localStorage during SSR, which crashes better-auth.
if (typeof window === "undefined") {
  const g = global as unknown as { localStorage?: Record<string, unknown> };
  if (g.localStorage && typeof g.localStorage.getItem !== "function") {
    try {
      delete g.localStorage;
    } catch {
      g.localStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { },
        length: 0,
        key: () => null,
      };
    }
  }
}

export const { signIn, signUp, useSession, signOut } = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL
})

// Comma-separated; NEXT_PUBLIC_ so the client can show admin controls. The server re-checks in requireAdmin.
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export const isAdminEmail = (email?: string | null) => !!email && ADMIN_EMAILS.includes(email.toLowerCase())

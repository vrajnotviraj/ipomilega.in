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

const ADMIN_EMAILS = ["admin@gmail.com", "snehshah7634@gmail.com", "shahvraj114@gmail.com", "devanshisoni2004@gmail.com", "devanshisoni2311@gmail.com"]

export const isAdminEmail = (email?: string | null) => ADMIN_EMAILS.includes(email || "")

import { createAuthClient } from "better-auth/react"

// Node/SSR environment localStorage safety guard
// If global.localStorage exists (due to a host environment CLI flag/mock) but is not a valid function,
// we delete it or mock it properly to prevent better-auth and other libraries from crashing during SSR.
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

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.BETTER_AUTH_URL
})

export const { signIn, signUp, useSession, signOut } = authClient;
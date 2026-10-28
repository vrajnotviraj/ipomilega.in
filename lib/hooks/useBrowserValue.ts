import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/**
 * A value only the browser can read (the clock, the URL, localStorage): null on the server and during hydration,
 * then `read()` on every render. `read` must return a primitive so repeat calls compare equal.
 */
export function useBrowserValue<T extends string | number | boolean | null>(read: () => T): T | null {
  return useSyncExternalStore(subscribeNever, read, () => null);
}

// What this browser remembers about the signup popup. Storage can throw (private mode, blocked site data),
// and then the popup simply behaves as on a first visit.

const KEY = 'ipm:alerts-popup';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

type Memory = { subscribedAt?: number; dismissedAt?: number };

function read(): Memory {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Memory;
  } catch {
    return {};
  }
}

function write(memory: Memory) {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // Nothing to do: the popup may show again next visit.
  }
}

/** True unless this browser has subscribed, or closed the popup in the last 7 days. */
export const popupIsDue = (now = Date.now()) => {
  const { subscribedAt, dismissedAt } = read();
  return !subscribedAt && !(dismissedAt && now - dismissedAt < SNOOZE_MS);
};

export const rememberSubscribed = () => write({ ...read(), subscribedAt: Date.now() });
export const rememberDismissed = () => write({ ...read(), dismissedAt: Date.now() });

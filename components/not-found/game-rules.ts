import type { Dictionary } from "@/messages";

export type GameWords = Dictionary["errors"]["game"];

export const ISSUE_PRICE = 404;
export const LOT = 300;
export const TICK_MS = 100;
export const TICKS = 120;
export const TICKS_PER_CANDLE = 6;
export const CIRCUIT = 0.2;
export const NEWS_TICKS = 20;

const ALLOT_ODDS = 0.7;
const NEWS_CHANCE = 0.035;
const NOISE = 0.03;
const STATS_KEY = "ipomilega-404-stats";

export type Phase = "ready" | "drawing" | "rejected" | "live" | "sold";
/** A headline's dictionary key and its price move. */
export type News = { key: keyof GameWords["news"]; move: number };

const NEWS: News[] = [
  { key: "anchorBook", move: 0.08 },
  { key: "hniBuying", move: 0.05 },
  { key: "gmpJumps", move: 0.06 },
  { key: "buyRating", move: 0.04 },
  { key: "promoterPledge", move: -0.08 },
  { key: "sellOff", move: -0.06 },
  { key: "operatorsExit", move: -0.1 },
  { key: "auditorResigns", move: -0.07 },
];

export type Stats = { trades: number; wins: number; streak: number; bestStreak: number; pnl: number; bestPct: number | null };
export type Candle = { open: number; close: number; high: number; low: number };

export const EMPTY_STATS: Stats = { trades: 0, wins: 0, streak: 0, bestStreak: 0, pnl: 0, bestPct: null };

export const gainPct = (price: number) => ((price - ISSUE_PRICE) / ISSUE_PRICE) * 100;
export const profitOnLot = (price: number) => (price - ISSUE_PRICE) * LOT;

/** Signed rupee amount, e.g. +₹12,300 or -₹4,500. */
export const signedRupees = (n: number) => `${n < 0 ? "-" : "+"}₹${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;

/** Signed percentage, e.g. +12.40%. */
export const signedPct = (n: number, digits = 2) => `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;

export const isAllotted = () => Math.random() < ALLOT_ODDS;

/** Listing-day open: a 25% discount up to a 45% premium, so both directions are in play. */
export const openingPrice = () => ISSUE_PRICE * (0.75 + Math.random() * 0.7);

/** A random headline, or null most ticks. */
export const maybeBreakingNews = (): News | null =>
  Math.random() < NEWS_CHANCE ? NEWS[Math.floor(Math.random() * NEWS.length)] : null;

/** Next price: random noise plus any news move, held inside the circuit band around the open. */
export function nextPrice(previous: number, open: number, newsMove: number) {
  const moved = previous * (1 + (Math.random() - 0.5) * NOISE + newsMove);
  return Math.min(open * (1 + CIRCUIT), Math.max(open * (1 - CIRCUIT), moved));
}

/** Groups the traded prices (everything after the issue price) into candles. */
export function toCandles(prices: number[]): Candle[] {
  const candles: Candle[] = [];
  const traded = prices.slice(1);
  for (let i = 0; i < traded.length; i += TICKS_PER_CANDLE) {
    const chunk = traded.slice(i, i + TICKS_PER_CANDLE);
    const open = candles.at(-1)?.close ?? chunk[0];
    const close = chunk[chunk.length - 1];
    candles.push({ open, close, high: Math.max(open, ...chunk), low: Math.min(open, ...chunk) });
  }
  return candles;
}

/** Stats after one more trade closes at this price. */
export function recordTrade(stats: Stats, soldAt: number): Stats {
  const gain = gainPct(soldAt);
  const isWin = gain >= 0;
  const streak = isWin ? stats.streak + 1 : 0;
  return {
    trades: stats.trades + 1,
    wins: stats.wins + (isWin ? 1 : 0),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    pnl: stats.pnl + profitOnLot(soldAt),
    bestPct: stats.bestPct === null ? gain : Math.max(stats.bestPct, gain),
  };
}

/** The dictionary key of the one-line verdict on a sold trade. */
export function verdict(gain: number): keyof GameWords["verdicts"] {
  if (gain >= 40) return "stag";
  if (gain >= 15) return "solidPop";
  if (gain >= 0) return "profit";
  if (gain >= -10) return "smallCut";
  return "heldDown";
}

/** The dictionary key of the player's rank for their running P&L. */
export function rankFor(pnl: number): keyof GameWords["ranks"] {
  if (pnl >= 200000) return "legend";
  if (pnl >= 50000) return "stag";
  if (pnl >= 0) return "regular";
  if (pnl >= -50000) return "rookie";
  return "bagholder";
}

// localStorage throws in private mode and some embeds; stats are a nicety, so failures are ignored.
export function storedStats(): string | null {
  try {
    return localStorage.getItem(STATS_KEY);
  } catch {
    return null;
  }
}

/** The stats saved as `stored`, or empty ones when there are none or they don't parse. */
export function parseStats(stored: string | null): Stats {
  try {
    return { ...EMPTY_STATS, ...JSON.parse(stored ?? "{}") };
  } catch {
    return EMPTY_STATS;
  }
}

export function saveStats(stats: Stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

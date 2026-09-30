"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const ISSUE_PRICE = 404;
const LOT = 300; // shares per lot, about ₹1.2 lakh like an SME application
const TICK_MS = 100;
const TICKS = 120; // 12 seconds of trading
const CIRCUIT = 0.2; // ±20% of the open
const ALLOT_ODDS = 0.7;
const STATS_KEY = "ipomilega-404-stats";

const NEWS = [
  { text: "Anchor book oversubscribed 80x", move: 0.08 },
  { text: "HNIs spotted buying on the open", move: 0.05 },
  { text: "GMP jumps on Telegram", move: 0.06 },
  { text: "Brokerage slaps a Buy rating", move: 0.04 },
  { text: "Promoter pledge rumours", move: -0.08 },
  { text: "Market-wide sell-off", move: -0.06 },
  { text: "Operators exit early", move: -0.1 },
  { text: "Auditor resigns (allegedly)", move: -0.07 },
];

type Phase = "ready" | "drawing" | "rejected" | "live" | "sold";
type Stats = { trades: number; wins: number; streak: number; bestStreak: number; pnl: number; bestPct: number | null };
const EMPTY_STATS: Stats = { trades: 0, wins: 0, streak: 0, bestStreak: 0, pnl: 0, bestPct: null };

const pct = (price: number) => ((price - ISSUE_PRICE) / ISSUE_PRICE) * 100;
const pnlOf = (price: number) => (price - ISSUE_PRICE) * LOT;
const inr = (n: number) => `${n < 0 ? "−" : "+"}₹${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;

function verdict(gain: number) {
  if (gain >= 40) return "Stag of the year. Your broker wants your autograph.";
  if (gain >= 15) return "A solid listing pop. Dalal Street approves.";
  if (gain >= 0) return "You made money. Most people can't say that on a 404.";
  if (gain >= -10) return "A small cut. At least the page wasn't real either.";
  return "You held all the way down. Classic retail.";
}

function rank(pnl: number) {
  if (pnl >= 200000) return "Dalal Street Legend";
  if (pnl >= 50000) return "Stag";
  if (pnl >= 0) return "Grey Market Regular";
  if (pnl >= -50000) return "Retail Rookie";
  return "Certified Bagholder";
}

function loadStats(): Stats {
  try {
    return { ...EMPTY_STATS, ...JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}") };
  } catch {
    return EMPTY_STATS;
  }
}

export default function ListingDayGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [prices, setPrices] = useState<number[]>([ISSUE_PRICE]);
  const [news, setNews] = useState<{ text: string; up: boolean } | null>(null);
  const [soldAt, setSoldAt] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const sim = useRef({ prices: [ISSUE_PRICE], open: ISSUE_PRICE, newsTicks: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> | null>(null);

  useEffect(() => setStats(loadStats()), []);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const last = prices[prices.length - 1];
  const open = sim.current.open;
  const lower = open * (1 - CIRCUIT);
  const upper = open * (1 + CIRCUIT);
  // At the lower circuit there are only sellers, so your order doesn't fill.
  const lockedDown = phase === "live" && last <= lower + 0.001;
  const lockedUp = phase === "live" && last >= upper - 0.001;

  const sell = useCallback((price: number) => {
    stop();
    setSoldAt(price);
    setPhase("sold");
    setNews(null);
    const gain = pct(price);
    setStats((s) => {
      const win = gain >= 0;
      const streak = win ? s.streak + 1 : 0;
      const next: Stats = {
        trades: s.trades + 1,
        wins: s.wins + (win ? 1 : 0),
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
        pnl: s.pnl + pnlOf(price),
        bestPct: s.bestPct === null ? gain : Math.max(s.bestPct, gain),
      };
      try { localStorage.setItem(STATS_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  }, []);

  const tick = useCallback(() => {
    const s = sim.current;
    if (s.prices.length > TICKS) return;
    const prev = s.prices[s.prices.length - 1];
    let move = (Math.random() - 0.5) * 0.03;
    if (s.newsTicks > 0) s.newsTicks -= 1;
    else setNews(null);
    if (s.newsTicks === 0 && Math.random() < 0.035) {
      const item = NEWS[Math.floor(Math.random() * NEWS.length)];
      move += item.move;
      s.newsTicks = 20;
      setNews({ text: item.text, up: item.move > 0 });
    }
    const next = Math.min(s.open * (1 + CIRCUIT), Math.max(s.open * (1 - CIRCUIT), prev * (1 + move)));
    s.prices = [...s.prices, next];
    setPrices(s.prices);
  }, []);

  const apply = useCallback(() => {
    stop();
    setSoldAt(null);
    setNews(null);
    setPhase("drawing");
    timer.current = setTimeout(() => {
      if (Math.random() > ALLOT_ODDS) {
        setPhase("rejected");
        return;
      }
      // IPOs gap at the open: a 25% discount up to a 45% premium, so both ways are live.
      const openPrice = ISSUE_PRICE * (0.75 + Math.random() * 0.7);
      sim.current = { prices: [ISSUE_PRICE, openPrice], open: openPrice, newsTicks: 0 };
      setPrices(sim.current.prices);
      setPhase("live");
      timer.current = setInterval(tick, TICK_MS);
    }, 900);
  }, [tick]);

  // Closing bell sells whatever you're still holding, circuit or not.
  useEffect(() => {
    if (phase === "live" && prices.length > TICKS) sell(last);
  }, [phase, prices.length, last, sell]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
      e.preventDefault();
      if (phase === "live") { if (!lockedDown) sell(last); }
      else if (phase !== "drawing") apply();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, last, lockedDown, sell, apply]);

  const resetStats = () => {
    setStats(EMPTY_STATS);
    try { localStorage.removeItem(STATS_KEY); } catch { /* private mode */ }
  };

  const showBand = phase === "live" || phase === "sold";
  const lo = Math.min(...prices, ISSUE_PRICE, showBand ? lower : ISSUE_PRICE) * 0.98;
  const hi = Math.max(...prices, ISSUE_PRICE, showBand ? upper : ISSUE_PRICE) * 1.02;
  const x = (i: number) => (i / TICKS) * 300;
  const y = (v: number) => 120 - ((v - lo) / (hi - lo)) * 120;
  const points = prices.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const shown = soldAt ?? last;
  const gain = pct(shown);
  const up = gain >= 0;
  const secondsLeft = Math.max(0, Math.ceil(((TICKS - prices.length + 1) * TICK_MS) / 1000));

  const status =
    phase === "live" ? `Closing bell in ${secondsLeft}s`
      : phase === "sold" ? "Market closed"
        : phase === "drawing" ? "Registrar drawing lots…"
          : phase === "rejected" ? "Not allotted"
            : "Pre-open";

  const hint =
    phase === "sold" ? verdict(gain)
      : phase === "rejected" ? "Oversubscribed 312x and your name wasn't drawn. Refund initiated. Try again?"
        : phase === "drawing" ? "Fingers crossed. Allotment is a lottery here too."
          : lockedDown ? "Stuck at the lower circuit. No buyers, so your sell order won't fill."
            : lockedUp ? "Upper circuit! Everyone wants in. Sell now or hope it holds."
              : phase === "live" ? "Watch the news and sell before the bell. Space works too."
                : `Apply for 1 lot (${LOT} shares at ₹${ISSUE_PRICE}). If you're allotted, pick your moment to sell.`;

  return (
    <div className="grid overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
          <span className="uppercase tracking-wide">PAGE404 · NSE SME</span>
          <span>{status}</span>
        </div>

        <div className="relative mt-3 h-48 sm:h-64 lg:h-80">
          <svg viewBox="0 0 300 120" className="h-full w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
            {showBand && (
              <>
                <line x1="0" x2="300" y1={y(upper)} y2={y(upper)} className="stroke-score-good/40" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <line x1="0" x2="300" y1={y(lower)} y2={y(lower)} className="stroke-score-bad/40" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              </>
            )}
            <line x1="0" x2="300" y1={y(ISSUE_PRICE)} y2={y(ISSUE_PRICE)} className="stroke-muted-foreground" strokeDasharray="4 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {prices.length > 1 && (
              <polyline points={points} fill="none" className={up ? "stroke-score-good" : "stroke-score-bad"} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            )}
          </svg>
          {phase === "ready" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="max-w-xs text-center font-serif text-lg text-muted-foreground">The bell hasn&apos;t rung yet. Apply to see if you get shares.</p>
            </div>
          )}
          {news && (
            <div
              role="status"
              className={`absolute left-2 top-2 max-w-[80%] rounded-md px-2 py-1 font-mono text-xs sm:text-sm font-medium text-white shadow animate-in fade-in slide-in-from-top-1 ${news.up ? "bg-score-good" : "bg-score-bad"}`}
            >
              {news.up ? "▲" : "▼"} BREAKING: {news.text}
            </div>
          )}
          {(lockedUp || lockedDown) && (
            <div className={`absolute bottom-2 right-2 rounded-md border bg-card px-2 py-1 font-mono text-xs font-semibold ${lockedUp ? "border-score-good text-score-good" : "border-score-bad text-score-bad"}`}>
              {lockedUp ? "UPPER" : "LOWER"} CIRCUIT
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
          <span>Issue ₹{ISSUE_PRICE}{showBand ? ` · Open ₹${open.toFixed(0)}` : ""}</span>
          {showBand && <span>Circuits ₹{lower.toFixed(0)} – ₹{upper.toFixed(0)}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border bg-background/40 p-4 sm:p-6 lg:border-l lg:border-t-0">
        <div className="font-mono">
          <div className="text-xs text-muted-foreground">{soldAt !== null ? "Sold at" : "Last traded"}</div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-3xl font-semibold text-foreground" aria-live="polite">₹{shown.toFixed(2)}</span>
            <span className={`text-lg font-semibold ${up ? "text-score-good" : "text-score-bad"}`}>{up ? "+" : ""}{gain.toFixed(2)}%</span>
          </div>
          <div className={`text-sm ${showBand ? (up ? "text-score-good" : "text-score-bad") : "text-muted-foreground"}`}>
            {showBand ? `${inr(pnlOf(shown))} on ${LOT} shares` : `1 lot = ${LOT} shares · ₹${(ISSUE_PRICE * LOT).toLocaleString("en-IN")}`}
          </div>
        </div>

        {phase === "live" ? (
          <Button size="lg" onClick={() => sell(last)} disabled={lockedDown} className="h-12 w-full bg-score-bad text-base text-white hover:bg-score-bad/90">
            {lockedDown ? "No buyers" : `Sell at ₹${last.toFixed(0)}`}
          </Button>
        ) : (
          <Button size="lg" onClick={apply} disabled={phase === "drawing"} className="h-12 w-full text-base">
            {phase === "ready" ? "Apply for 1 lot" : phase === "drawing" ? "Drawing lots…" : "Apply again"}
          </Button>
        )}
        <p className="min-h-10 text-sm text-muted-foreground">{hint}</p>

        {stats.trades > 0 ? (
          <div className="mt-auto border-t border-border pt-4 font-mono text-xs text-muted-foreground">
            <div className="text-xs">Your rank</div>
            <div className="text-base font-semibold text-foreground">{rank(stats.pnl)}</div>
            <div className={`mt-1 text-sm ${stats.pnl >= 0 ? "text-score-good" : "text-score-bad"}`}>Total P&amp;L {inr(stats.pnl)}</div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
              <dt>Trades</dt><dd className="text-right text-foreground">{stats.trades}</dd>
              <dt>Win rate</dt><dd className="text-right text-foreground">{Math.round((stats.wins / stats.trades) * 100)}%</dd>
              <dt>Streak</dt><dd className="text-right text-foreground">{stats.streak}{stats.streak >= 3 ? " 🔥" : ""} (best {stats.bestStreak})</dd>
              <dt>Best trade</dt><dd className="text-right text-foreground">{stats.bestPct !== null && stats.bestPct >= 0 ? "+" : ""}{stats.bestPct?.toFixed(1)}%</dd>
            </dl>
            <button type="button" onClick={resetStats} className="mt-3 underline underline-offset-4 hover:text-foreground">
              Reset portfolio
            </button>
          </div>
        ) : (
          <ul className="mt-auto space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
            <li>🎟️ Allotment is a lottery: about 7 in 10 get shares.</li>
            <li>📰 Breaking news can swing the price either way.</li>
            <li>🚦 Circuits cap it at ±20% of the open. At the lower one, nobody buys.</li>
            <li>🔔 At the bell you sell at whatever the price is.</li>
          </ul>
        )}
      </div>
    </div>
  );
}

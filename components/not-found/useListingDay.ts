import { useEffect, useRef, useState } from "react";
import {
  CIRCUIT, EMPTY_STATS, ISSUE_PRICE, NEWS_TICKS, TICKS, TICK_MS,
  isAllotted, loadStats, maybeBreakingNews, nextPrice, openingPrice, recordTrade, saveStats,
  type News, type Phase, type Stats,
} from "@/components/not-found/game-rules";

const DRAW_MS = 900;

/** Runs one listing-day round: apply, allotment draw, live trading, sell. Space triggers the main action. */
export function useListingDay() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [prices, setPrices] = useState<number[]>([ISSUE_PRICE]);
  const [news, setNews] = useState<News | null>(null);
  const [soldAt, setSoldAt] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const market = useRef({ prices: [ISSUE_PRICE], open: ISSUE_PRICE, newsTicksLeft: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const stopTimer = () => clearTimeout(timer.current);

  useEffect(() => setStats(loadStats()), []);
  useEffect(() => stopTimer, []);

  const last = prices[prices.length - 1];
  const open = market.current.open;
  const lower = open * (1 - CIRCUIT);
  const upper = open * (1 + CIRCUIT);
  // At the lower circuit there are only sellers, so a sell order can't fill.
  const lockedDown = phase === "live" && last <= lower + 0.001;
  const lockedUp = phase === "live" && last >= upper - 0.001;

  function sell(price: number) {
    stopTimer();
    setSoldAt(price);
    setPhase("sold");
    setNews(null);
    setStats((current) => {
      const next = recordTrade(current, price);
      saveStats(next);
      return next;
    });
  }

  function tick() {
    const m = market.current;
    if (m.newsTicksLeft > 0) m.newsTicksLeft -= 1;
    else setNews(null);

    let newsMove = 0;
    const headline = m.newsTicksLeft === 0 ? maybeBreakingNews() : null;
    if (headline) {
      newsMove = headline.move;
      m.newsTicksLeft = NEWS_TICKS;
      setNews(headline);
    }

    const price = nextPrice(m.prices[m.prices.length - 1], m.open, newsMove);
    m.prices = [...m.prices, price];
    setPrices(m.prices);

    const isClosingBell = m.prices.length > TICKS;
    if (isClosingBell) sell(price);
  }

  function startTrading() {
    const openPrice = openingPrice();
    market.current = { prices: [ISSUE_PRICE, openPrice], open: openPrice, newsTicksLeft: 0 };
    setPrices(market.current.prices);
    setPhase("live");
    timer.current = setInterval(tick, TICK_MS);
  }

  function apply() {
    stopTimer();
    setSoldAt(null);
    setNews(null);
    setPhase("drawing");
    timer.current = setTimeout(() => (isAllotted() ? startTrading() : setPhase("rejected")), DRAW_MS);
  }

  function resetStats() {
    setStats(EMPTY_STATS);
    saveStats(null);
  }

  function mainAction() {
    if (phase === "live") {
      if (!lockedDown) sell(last);
      return;
    }
    if (phase !== "drawing") apply();
  }

  const mainActionRef = useRef(mainAction);
  mainActionRef.current = mainAction;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isOnControl = e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement;
      if (e.code !== "Space" || isOnControl) return;
      e.preventDefault();
      mainActionRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return {
    phase, prices, news, soldAt, stats, last, open, lower, upper, lockedUp, lockedDown,
    apply, sellNow: () => sell(last), resetStats,
  };
}

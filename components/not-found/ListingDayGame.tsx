"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/locales";
import { CandleChart } from "@/components/not-found/CandleChart";
import { PortfolioStats } from "@/components/not-found/PortfolioStats";
import { useListingDay } from "@/components/not-found/useListingDay";
import {
  ISSUE_PRICE, LOT, TICKS, TICK_MS,
  gainPct, profitOnLot, signedPct, signedRupees, verdict, type GameWords, type Phase,
} from "@/components/not-found/game-rules";

const BUTTON = "h-12 w-full rounded-full text-base font-medium transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

type Round = ReturnType<typeof useListingDay>;

/** Short market status shown above the chart. */
function statusLabel(d: GameWords, phase: Phase, secondsLeft: number) {
  if (phase === "live") return fill(d.closingBellIn, { seconds: secondsLeft });
  if (phase === "sold") return d.marketClosed;
  if (phase === "drawing") return d.drawingLots;
  if (phase === "rejected") return d.notAllotted;
  return d.preOpen;
}

/** One line of guidance under the action button. */
function hintFor(d: GameWords, { phase, lockedDown, lockedUp, soldAt }: Round) {
  if (phase === "sold") return d.verdicts[verdict(gainPct(soldAt ?? ISSUE_PRICE))];
  if (phase === "rejected") return d.hintRejected;
  if (phase === "drawing") return d.hintDrawing;
  if (lockedDown) return d.hintLockedDown;
  if (lockedUp) return d.hintLockedUp;
  if (phase === "live") return d.hintLive;
  return fill(d.hintReady, { lot: LOT, price: ISSUE_PRICE });
}

/** Apply or sell, depending on the phase. */
function ActionButton({ phase, last, lockedDown, apply, sellNow }: Round) {
  const d = useT().errors.game;
  if (phase === "live") {
    return (
      <button type="button" onClick={sellNow} disabled={lockedDown} className={cn(BUTTON, "bg-score-bad text-primary-foreground hover:bg-score-bad/90")}>
        {lockedDown ? d.noBuyers : <>{d.sellAt} <span className="font-mono tabular-nums">₹{last.toFixed(0)}</span></>}
      </button>
    );
  }
  const label = phase === "ready" ? d.applyOneLot : phase === "drawing" ? d.drawing : d.applyAgain;
  return (
    <button type="button" onClick={apply} disabled={phase === "drawing"} className={cn(BUTTON, "bg-primary text-primary-foreground hover:bg-primary/90")}>
      {label}
    </button>
  );
}

/** Price, gain and rupee P&L for the current or sold price. */
function PriceReadout({ round, showBand }: { round: Round; showBand: boolean }) {
  const d = useT().errors.game;
  const shown = round.soldAt ?? round.last;
  const gain = gainPct(shown);
  const gainColor = gain >= 0 ? "text-score-good" : "text-score-bad";

  return (
    <div className="font-mono tabular-nums">
      <div className="text-xs text-muted-foreground">{round.soldAt !== null ? d.soldAt : d.lastTraded}</div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-3xl font-medium text-foreground" aria-live="polite">₹{shown.toFixed(2)}</span>
        <span className={cn("text-lg font-medium", gainColor)}>{signedPct(gain)}</span>
      </div>
      <div className={cn("text-sm", showBand ? gainColor : "text-muted-foreground")}>
        {showBand
          ? fill(d.profitOnShares, { amount: signedRupees(profitOnLot(shown)), lot: LOT })
          : fill(d.lotIs, { lot: LOT, amount: (ISSUE_PRICE * LOT).toLocaleString("en-IN") })}
      </div>
    </div>
  );
}

/** Overlays on the chart: the pre-open prompt, breaking news and circuit locks. */
function ChartOverlays({ phase, news, lockedUp, lockedDown }: Round) {
  const d = useT().errors.game;
  return (
    <>
      {phase === "ready" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="max-w-xs text-center font-display text-lg font-bold text-muted-foreground">{d.bellNotRung}</p>
        </div>
      )}
      {news && (
        <div
          role="status"
          className={cn(
            "absolute left-2 top-2 max-w-[80%] rounded-full px-3 py-1 font-mono text-xs font-medium text-primary-foreground animate-in fade-in slide-in-from-top-1 sm:text-sm",
            news.move > 0 ? "bg-score-good" : "bg-score-bad"
          )}
        >
          {news.move > 0 ? "▲" : "▼"} {fill(d.breaking, { headline: d.news[news.key] })}
        </div>
      )}
      {(lockedUp || lockedDown) && (
        <div
          className={cn(
            "absolute bottom-2 right-2 rounded-full border bg-card px-3 py-1 font-mono text-xs font-medium",
            lockedUp ? "border-score-good text-score-good" : "border-score-bad text-score-bad"
          )}
        >
          {lockedUp ? d.upperCircuit : d.lowerCircuit}
        </div>
      )}
    </>
  );
}

/** A 12-second listing-day trading game for the 404 page. */
export default function ListingDayGame() {
  const d = useT().errors.game;
  const round = useListingDay();
  const { phase, prices, open, lower, upper } = round;
  const showBand = phase === "live" || phase === "sold";
  const secondsLeft = Math.max(0, Math.ceil(((TICKS - prices.length + 1) * TICK_MS) / 1000));

  return (
    <div className="grid overflow-hidden rounded-[18px] border border-border bg-card text-left lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
          <span className="uppercase tracking-[0.04em]">PAGE404 · NSE SME</span>
          <span className="tabular-nums">{statusLabel(d, phase, secondsLeft)}</span>
        </div>

        <div className="relative mt-3 h-48 sm:h-64 lg:h-80">
          <CandleChart prices={prices} lower={lower} upper={upper} showBand={showBand} isLive={phase === "live"} />
          <ChartOverlays {...round} />
        </div>

        <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 font-mono text-xs tabular-nums text-muted-foreground">
          <span>{d.issue} ₹{ISSUE_PRICE}{showBand && ` · ${d.open} ₹${open.toFixed(0)}`}</span>
          {showBand && <span>{fill(d.circuits, { lower: lower.toFixed(0), upper: upper.toFixed(0) })}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border bg-secondary p-4 sm:p-6 lg:border-l lg:border-t-0">
        <PriceReadout round={round} showBand={showBand} />
        <ActionButton {...round} />
        <p className="min-h-10 text-sm text-muted-foreground">{hintFor(d, round)}</p>
        <PortfolioStats stats={round.stats} onReset={round.resetStats} />
      </div>
    </div>
  );
}

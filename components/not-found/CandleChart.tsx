import { ISSUE_PRICE, TICKS, TICKS_PER_CANDLE, toCandles, type Candle } from "@/components/not-found/game-rules";

const WIDTH = 300;
const HEIGHT = 120;
const SLOT = WIDTH / (TICKS / TICKS_PER_CANDLE);
const BODY = SLOT * 0.6;

type CandleChartProps = { prices: number[]; lower: number; upper: number; showBand: boolean; isLive: boolean };

/** Colour of a candle: marigold while it is still forming, otherwise green up or red down. */
function candleColor(candle: Candle, isForming: boolean) {
  if (isForming) return "fill-brand-accent stroke-brand-accent";
  return candle.close >= candle.open ? "fill-score-good stroke-score-good" : "fill-score-bad stroke-score-bad";
}

/** Candlestick chart of the listing day, with the issue price and circuit limits as guide lines. */
export function CandleChart({ prices, lower, upper, showBand, isLive }: CandleChartProps) {
  const candles = toCandles(prices);
  const bounds = showBand ? [lower, upper] : [];
  const lo = Math.min(...prices, ISSUE_PRICE, ...bounds) * 0.98;
  const hi = Math.max(...prices, ISSUE_PRICE, ...bounds) * 1.02;
  const y = (price: number) => HEIGHT - ((price - lo) / (hi - lo)) * HEIGHT;

  const guide = (price: number, className: string) => (
    <line x1="0" x2={WIDTH} y1={y(price)} y2={y(price)} className={className} strokeDasharray="4 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
  );

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-full w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
      {showBand && guide(upper, "stroke-score-good/50")}
      {showBand && guide(lower, "stroke-score-bad/50")}
      {guide(ISSUE_PRICE, "stroke-muted-foreground")}
      {candles.map((candle, i) => {
        const center = i * SLOT + SLOT / 2;
        const top = y(Math.max(candle.open, candle.close));
        const bodyHeight = Math.max(0.8, Math.abs(y(candle.open) - y(candle.close)));
        const isForming = isLive && i === candles.length - 1;
        return (
          <g key={i} className={candleColor(candle, isForming)}>
            <line x1={center} x2={center} y1={y(candle.high)} y2={y(candle.low)} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <rect x={center - BODY / 2} y={top} width={BODY} height={bodyHeight} stroke="none" />
          </g>
        );
      })}
    </svg>
  );
}

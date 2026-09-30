import { cn } from "@/lib/utils";

const CANDLES = [
  { x: 8, y: 16, h: 32, wick: [10, 54] },
  { x: 26, y: 30, h: 14, wick: [26, 50] },
  { x: 44, y: 11, h: 37, wick: [5, 54] },
];

/** Candle M: three candles on a shared base, the marigold one breaking out. `reversed` is for ink backgrounds. */
export function LogoMark({ className, reversed = false }: { className?: string; reversed?: boolean }) {
  const ink = reversed ? "var(--background)" : "var(--brand-mark)";
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      {CANDLES.map(({ x, y, h, wick }, i) => (
        <g key={x}>
          <line x1={x + 6} y1={wick[0]} x2={x + 6} y2={wick[1]} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
          <rect x={x} y={y} width={12} height={h} rx={3} fill={i === 2 ? "var(--brand-accent)" : ink} />
        </g>
      ))}
    </svg>
  );
}

const SIZES = {
  sm: { word: "text-lg", mark: "h-7 w-7" },
  lg: { word: "text-2xl", mark: "h-9 w-9" },
};

/** Mark plus wordmark: "IPO" in Black, "Milega" in Medium, both in ink. */
export function Logo({ size, className }: { size: keyof typeof SIZES; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark className={SIZES[size].mark} />
      <span className={cn("font-display tracking-[-0.045em] text-foreground", SIZES[size].word)}>
        <span className="font-black">IPO</span> <span className="font-medium">Milega</span>
      </span>
    </span>
  );
}

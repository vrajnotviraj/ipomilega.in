import { cn } from "@/lib/utils";

/** Brand mark: a ring around a rising arrow. Stroke color comes from --brand-mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="IPO Milega"
      className={className}
      fill="none"
      stroke="var(--brand-mark)"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="24" cy="24" r="17.5" />
      <polyline points="10.5,30.75 19.3,22 26,28.7 37.5,17.25" />
      <polyline points="29.4,17.25 37.5,17.25 37.5,25.35" />
    </svg>
  );
}

const SIZES = {
  sm: { word: "text-lg", mark: "h-8 w-8" },
  lg: { word: "text-2xl", mark: "h-10 w-10" },
};

/** Mark plus wordmark, with an optional tagline shown from `sm` up. */
export function Logo({ size, className, showTagline = false }: { size: keyof typeof SIZES; className?: string; showTagline?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={SIZES[size].mark} />
      <span className="flex items-baseline gap-2 min-w-0">
        <span className={cn("font-serif font-semibold tracking-tight text-foreground", SIZES[size].word)}>IPO Milega</span>
        {showTagline && (
          <span className="hidden sm:inline text-xs italic text-muted-foreground font-sans">§ Prospectus Analysis</span>
        )}
      </span>
    </span>
  );
}

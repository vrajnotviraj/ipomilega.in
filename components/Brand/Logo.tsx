import { cn } from "@/lib/utils";

/**
 * IPO Milega brand mark: a scan ring sweeping an ascending arrow -- continuous
 * analysis, from filing to listing gain.
 *
 * Monoline and single-colour, as approved. The stroke is `--brand-mark`, which
 * is the primary teal in light (#1F4E5C) and lifts to #2E6B7D in dark so the
 * mark never sinks into the page. Concrete-colour copies for the places that
 * cannot read a CSS variable -- favicon, OG images, anything handed to a third
 * party -- live in `public/logo/`.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="IPO Milega"
      className={cn("h-9 w-9", className)}
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

interface LogoProps {
  className?: string;
  markClassName?: string;
  /** Word size. `sm` for headers and dense rows, `lg` for footers and cards. */
  size?: "sm" | "md" | "lg";
  /** The "§ Prospectus Analysis" kicker -- hidden below `sm` where it is shown. */
  showTagline?: boolean;
  taglineClassName?: string;
}

const wordSizes = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
} as const;

const markSizes = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-10 w-10",
} as const;

/** Mark plus wordmark. Use this anywhere the brand is presented as a unit. */
export function Logo({
  className,
  markClassName,
  size = "md",
  showTagline = false,
  taglineClassName,
}: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={cn(markSizes[size], markClassName)} />
      <span className="flex items-baseline gap-2 min-w-0">
        <span
          className={cn(
            "font-serif font-semibold tracking-tight text-foreground",
            wordSizes[size]
          )}
        >
          IPO Milega
        </span>
        {showTagline && (
          <span
            className={cn(
              "hidden sm:inline text-xs italic text-muted-foreground font-sans",
              taglineClassName
            )}
          >
            § Prospectus Analysis
          </span>
        )}
      </span>
    </span>
  );
}

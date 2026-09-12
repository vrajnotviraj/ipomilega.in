import { cn } from "@/lib/utils";

/**
 * IPO Milega brand mark: a teal seal holding a rising market line that breaks
 * out into a gold arrow. Colours come from the brand tokens in globals.css
 * (--brand-mark / --brand-mark-fg / --brand-accent), which lift slightly in
 * dark so the seal never sinks into the page.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="IPO Milega"
      className={cn("h-9 w-9", className)}
    >
      <rect width="32" height="32" rx="9" fill="var(--brand-mark)" />
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      >
        <path d="M6.5 22.5 12 14.5l4.5 4L23 9" stroke="var(--brand-mark-fg)" />
        <path d="M18.6 9H23v4.4" stroke="var(--brand-accent)" />
      </g>
      <rect
        x="6.5"
        y="25.4"
        width="19"
        height="1.6"
        rx="0.8"
        fill="var(--brand-mark-fg)"
        opacity="0.28"
      />
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

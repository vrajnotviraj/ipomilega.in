import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "h-4 w-4", ring: "border-[1.5px]" },
  md: { box: "h-6 w-6", ring: "border-2" },
  lg: { box: "h-9 w-9", ring: "border-2" },
} as const;

/**
 * The app's single loading indicator: a thin ring with one lit quadrant. Deliberately quiet --
 * it sits on a cream/ink editorial palette, so it borrows `--border` for the track and
 * `--primary` for the moving arc rather than introducing a colour of its own.
 */
export function Loader({
  size = "md",
  className,
  label,
}: {
  size?: keyof typeof SIZES;
  className?: string;
  /** Screen-reader text; also rendered visibly by <PageLoader />. */
  label?: string;
}) {
  const { box, ring } = SIZES[size];

  return (
    <span className={cn("relative inline-flex flex-shrink-0", box, className)} role="status">
      <span className={cn("absolute inset-0 rounded-full border-border", ring)} />
      <span
        className={cn("absolute inset-0 rounded-full border-transparent border-t-primary animate-spin", ring)}
        style={{ animationDuration: "0.7s" }}
      />
      <span className="sr-only">{label ?? "Loading"}</span>
    </span>
  );
}

/**
 * Full-height centred loader for route-level <Suspense> fallbacks.
 */
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-4">
      <Loader size="lg" label={label} />
      <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
    </div>
  );
}

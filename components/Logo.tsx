import { cn } from "@/lib/utils";

/**
 * The IPO Milega mark: a scan ring sweeping an ascending arrow.
 *
 * Drawn with `currentColor` rather than a baked hex, so one component covers every placement --
 * `text-primary` gives the teal, `text-primary-foreground` the reversed cream on a filled
 * ground, and the dark theme's lighter `--primary` follows automatically. The static files in
 * `public/logo/` carry concrete colours for the places that can't inherit one (favicon, OG
 * images, anything handed to a third party).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-7 w-7", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="IPO Milega"
    >
      <circle cx="24" cy="24" r="17.5" />
      <polyline points="10.5,30.75 19.3,22 26,28.7 37.5,17.25" />
      <polyline points="29.4,17.25 37.5,17.25 37.5,25.35" />
    </svg>
  );
}

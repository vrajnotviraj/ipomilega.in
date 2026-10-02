/** Previous and next pill links under a paged list. */
export const PAGER =
  "inline-flex items-center gap-1 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2";

/** The page number from an optional [[...page]] segment: 1 when absent, null for "1", junk or extra segments. */
export function pageFromSegments(segments?: string[]): number | null {
  if (!segments) return 1;
  if (segments.length !== 1 || !/^[1-9]\d*$/.test(segments[0])) return null;
  const page = Number(segments[0]);
  return page > 1 ? page : null;
}

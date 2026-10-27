"use client";
import { formatIstTimestamp } from "@/lib/ipo/format";
import { useGmpHistory } from "@/components/analysis/overview/gmp-trend/gmp-history";

/** When the GMP was last checked, read in the browser so it stays current between page purges; the cached page's time until then. */
export function GmpUpdatedTime({ ipoId, cachedAt }: { ipoId: string; cachedAt: string | undefined }) {
  const history = useGmpHistory(ipoId);
  const latest = Array.isArray(history) ? history.at(-1)?.as_of : undefined;
  return <>{formatIstTimestamp(latest ?? cachedAt)}</>;
}

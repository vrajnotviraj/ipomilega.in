"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loader";

// Module-level so it survives the boundary remounting after reset(); a ref would reset and
// turn one failure into an endless retry loop.
let lastAutoRetry = 0;
const AUTO_RETRY_COOLDOWN_MS = 30_000;

/**
 * Route-level error boundary.
 *
 * Data loaders now throw instead of returning empty lists (an empty fallback got ISR-cached as
 * the real page). The usual cause is a transient Mongo hiccup, so retry once on our own --
 * the user shouldn't have to be the one mashing refresh -- and only show a button if that
 * retry fails too.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [autoRetrying] = useState(() => Date.now() - lastAutoRetry > AUTO_RETRY_COOLDOWN_MS);

  const retry = () => {
    router.refresh();
    reset();
  };

  useEffect(() => {
    console.error(error);
    if (!autoRetrying) return;
    lastAutoRetry = Date.now();
    const t = setTimeout(retry, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, autoRetrying]);

  if (autoRetrying) {
    return (
      <div className="app-container pt-24 pb-16">
        <PageLoader label="Loading" />
      </div>
    );
  }

  return (
    <div className="app-container pt-24 pb-16 text-center space-y-4">
      <p className="text-muted-foreground">Couldn&apos;t load the latest data.</p>
      <Button onClick={retry}>Try again</Button>
    </div>
  );
}

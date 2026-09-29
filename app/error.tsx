"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loader";

// Module-level so it survives the remount after reset(); a ref would reset and retry forever.
let lastAutoRetry = 0;
const AUTO_RETRY_COOLDOWN_MS = 30_000;

/** Retries a failed load once on its own, then shows a retry button. */
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
    const timer = setTimeout(retry, 1200);
    return () => clearTimeout(timer);
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

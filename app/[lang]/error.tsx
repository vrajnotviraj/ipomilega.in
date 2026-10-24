"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { PageLoader } from "@/components/ui/loader";
import { useT } from "@/lib/i18n/client";

// Module-level so it survives the remount after reset(); a ref would reset and retry forever.
let lastAutoRetry = 0;
const AUTO_RETRY_COOLDOWN_MS = 30_000;

/** Retries a failed load once on its own, then shows a retry button. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const d = useT().errors.error;
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
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="app-container flex flex-col items-center gap-4 pt-32 pb-24 text-center">
      <h1 className="font-display text-3xl font-bold tracking-tight">{d.heading}</h1>
      <p className="text-muted-foreground">{d.body}</p>
      <button
        type="button"
        onClick={retry}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]"
      >
        <RotateCw className="size-4" strokeWidth={2} />
        {d.retry}
      </button>
    </div>
  );
}

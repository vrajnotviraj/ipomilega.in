"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

/** The note that the data is manually reviewed, is not investment advice, and the standard market-risk clause. */
export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {useT().common.disclaimer}
    </p>
  );
}

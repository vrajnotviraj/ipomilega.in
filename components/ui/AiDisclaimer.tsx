import { cn } from "@/lib/utils";

/** The note that the analysis is AI-generated from the prospectus and is not investment advice. */
export function AiDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      IPO Milega generates this analysis automatically from each company&apos;s public RHP/DRHP filing using AI. It is not
      investment advice, and IPO Milega accepts no responsibility for losses arising from any investment decision. Always
      read the full prospectus before applying.
    </p>
  );
}

import { cn } from "@/lib/utils";

/** The note that the data is manually reviewed, is not investment advice, and the standard market-risk clause. */
export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      The data on this page has been reviewed manually by the IPO Milega research team. It is not investment advice, and IPO
      Milega accepts no responsibility for losses arising from any investment decision. Investments in the securities market
      are subject to market risks. Read all the related documents, including the full prospectus, carefully before investing.
    </p>
  );
}

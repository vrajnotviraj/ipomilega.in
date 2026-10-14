const RULES = [
  "Every bid goes in on the last day, so your money stays free as long as it can. Brokers stop taking bids around 3 PM.",
  "Retail and S-HNI winners are drawn by lottery, one minimum application each, so each account bids the minimum. Your odds are about 1 in the subscription.",
  "Until bidding closes, the subscription is estimated from the GMP, or the live figure if that's higher. In past IPOs, retail ended near 1.2x the GMP % and S-HNI near 4x.",
  "Money comes back on the refund date (about T+2) and pays for later IPOs. An allotted bid's money comes back the day after listing, once you sell.",
  "Weekends are skipped, exchange holidays aren't.",
];

/** The rules the plan follows, folded away under a summary. */
export function HowItWorks() {
  return (
    <details className="mt-8 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
      <summary className="cursor-pointer font-medium text-foreground">How the plan is worked out</summary>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-pretty">
        {RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs">
        GMP is unofficial and changes daily. This plan is an estimate and not investment advice. Investments in the securities market are
        subject to market risks; read the offer document before investing.
      </p>
    </details>
  );
}

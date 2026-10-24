const RULES = [
  "Every bid goes in on the last day, so your money stays free as long as it can. Brokers stop taking bids around 3 PM.",
  "Retail, S-HNI and shareholder-quota winners are drawn by lottery, one minimum application each, so each account bids the minimum. Your odds are about 1 in the subscription.",
  "B-HNI bids start at about ₹10 lakh, but a lottery winner gets only the S-HNI minimum, about ₹2 lakh of shares, so the gain is counted on that. Odds are 1 in the subscription times that fifth. Under about 5x, everyone is allotted, pro rata.",
  "An account bids in one of retail, S-HNI or B-HNI per IPO. The shareholder quota is extra: tell us how many accounts hold the parent's shares on the record date, and each can bid up to ₹2 lakh there as well.",
  "On the last day the live subscription is used. Before that it is estimated from the GMP, or the live figure if that's higher. In past IPOs, retail ended near 1.2x the GMP % and S-HNI near 4x. B-HNI (6x) and the quota (1.2x) are our guesses.",
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

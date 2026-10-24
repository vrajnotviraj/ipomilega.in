/** Shown while the plan is searched: the three candles of the mark rising in turn. */
export function PlanLoader() {
  return (
    <div role="status" className="flex flex-col items-center gap-5 rounded-[18px] border border-border bg-card px-6 py-14 text-center">
      <span aria-hidden className="candle-load flex h-14 items-end gap-2.5">
        <span className="h-12 w-3.5 rounded-[5px] bg-primary" />
        <span className="h-8 w-3.5 rounded-[5px] bg-primary/60" />
        <span className="h-14 w-3.5 rounded-[5px] bg-brand-accent" />
      </span>
      <div>
        <p className="font-display text-lg font-bold tracking-[-0.015em] text-foreground">Working out your best plan</p>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">Trying every mix of IPOs, categories and accounts.</p>
      </div>
    </div>
  );
}

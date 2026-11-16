import { t } from "@/lib/i18n/server";
import { TwoPools } from "@/components/shareholder-quota/hero/TwoPools";

/** The page title, the update time and the stage links, with the two-pools panel beside them. */
export function Hero({ lastChecked, children }: { lastChecked: string | null; children: React.ReactNode }) {
  const d = t().quota;
  return (
    <header className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
      <div className="min-w-0">
        <h1 className="type-hero text-[32px] text-balance break-words text-foreground sm:text-[40px]">
          {d.hero.before} <span className="highlight">{d.hero.highlight}</span> {d.hero.after}
        </h1>
        <p className="mt-3 max-w-[60ch] text-pretty text-foreground">{d.hero.lede}</p>
        {lastChecked && (
          <p className="mt-1 text-sm text-muted-foreground">
            {d.lastChecked} <span className="font-mono tabular-nums">{lastChecked}</span>.
          </p>
        )}
        <div className="mt-6">{children}</div>
      </div>
      <TwoPools />
    </header>
  );
}

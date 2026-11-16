import { t } from "@/lib/i18n/server";
import { figureFont } from "@/components/shareholder-quota/figureFont";

/** The issue drawn as a bar with the quota cut off at 10%, who can bid in each part, then the three rules. */
export function TwoPools() {
  const d = t().quota.hero;
  return (
    <section aria-labelledby="pools-title" className="min-w-0 rounded-xl bg-primary p-5 text-primary-foreground sm:p-6">
      <h2 id="pools-title" className="font-display text-lg font-bold tracking-[-0.015em]">{d.split.title}</h2>

      <div aria-hidden className="mt-4 flex h-3 gap-1">
        <span className="flex-[9] rounded-full bg-primary-foreground/35" />
        <span className="flex-1 rounded-full bg-brand-accent" />
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        <Pool colour="bg-primary-foreground/35" name={d.split.everyone} note={d.split.everyoneNote} />
        <Pool colour="bg-brand-accent" name={d.split.quota} note={d.split.quotaNote} />
      </ul>
      <p className="mt-4 text-sm text-pretty">{d.split.both}</p>

      <h3 className="sr-only">{d.rulesTitle}</h3>
      <dl className="mt-5 grid grid-cols-3 divide-x divide-primary-foreground/20 border-t border-primary-foreground/20 pt-4">
        {d.rules.map((rule) => (
          <div key={rule.label} className="flex min-w-0 flex-col-reverse justify-end gap-1 px-3 first:pl-0 last:pr-0">
            <dt className="text-[13px] leading-snug text-pretty text-primary-foreground/80">{rule.label}</dt>
            <dd className={`${figureFont(rule.value)} text-lg leading-tight tabular-nums sm:text-xl`}>{rule.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** One part of the bar's key: its colour, who it is for, and a short note. */
function Pool({ colour, name, note }: { colour: string; name: string; note: string }) {
  return (
    <li className="grid grid-cols-[0.625rem_minmax(0,1fr)] gap-x-2.5">
      <span aria-hidden className={`mt-[0.4em] size-2.5 rounded-full ${colour}`} />
      <span className="min-w-0">
        <span className="block font-medium leading-snug">{name}</span>
        <span className="block text-sm text-primary-foreground/80">{note}</span>
      </span>
    </li>
  );
}

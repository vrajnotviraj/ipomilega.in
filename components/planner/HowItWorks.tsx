import { useT } from "@/lib/i18n/client";

/** The rules the plan follows, folded away under a summary. */
export function HowItWorks() {
  const d = useT().planner.how;
  return (
    <details className="mt-8 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
      <summary className="cursor-pointer font-medium text-foreground">{d.summary}</summary>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-pretty">
        {d.rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs">
        {d.disclaimer}
      </p>
    </details>
  );
}

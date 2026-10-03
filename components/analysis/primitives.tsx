import { getRiskTextColor } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";

/** A 0-10 score as a large display figure with a mono "/10", in the current text colour. */
export function ScoreFigure({ score }: { score: number }) {
  return (
    <span className="font-display text-4xl font-bold tabular-nums">
      {score.toFixed(1)}
      <span className="font-mono text-base font-normal text-muted-foreground">/10</span>
    </span>
  );
}

/** Small uppercase label above a figure or block. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground", className)}>{children}</div>
  );
}

/** A 0-10 score as a mono pill, coloured by band. A missing score reads as 0. */
function ScoreChip({ score }: { score: number | null | undefined }) {
  const value = score ?? 0;
  return (
    <span className={cn("rounded-full border border-border bg-card px-3 py-1 font-mono text-sm font-medium tabular-nums", getRiskTextColor(value))}>
      {value.toFixed(1)}/10
    </span>
  );
}

/** Section title on the left and the section score on the right. */
export function SectionHeading({ title, score }: { title: string; score: number | null | undefined }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <h2 className="type-h2 text-balance">{title}</h2>
      <ScoreChip score={score} />
    </div>
  );
}

/** Ten dots with one filled per score point, in the current text colour. */
export function DotScale({ score }: { score: number }) {
  const filled = Math.round(Math.max(0, Math.min(10, score)));
  return (
    <span className="flex gap-1" aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => (
        <span key={index} className={cn("size-1.5 rounded-full bg-current", index >= filled && "opacity-20")} />
      ))}
    </span>
  );
}

/** Analysis text as written, keeping its line breaks. */
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("max-w-[65ch] whitespace-pre-wrap text-pretty text-base leading-relaxed", className)}>{children}</p>;
}

/**
 * Titled notes as a definition list, one under another with hairlines between, or side by side from sm up
 * with `columns`. Entries without text are left out.
 */
export function FactList({
  facts,
  columns = false,
  className,
}: {
  facts: { term: string; detail?: React.ReactNode }[];
  columns?: boolean;
  className?: string;
}) {
  const shown = facts.filter((fact) => fact.detail);
  if (shown.length === 0) return null;

  return (
    <dl className={cn(columns ? "grid gap-x-10 sm:grid-cols-2" : "divide-y divide-border", className)}>
      {shown.map(({ term, detail }) => (
        <div key={term} className={columns ? "border-t border-border py-4" : "py-4 first:pt-0 last:pb-0"}>
          <dt className="font-display text-base font-bold tracking-[-0.015em]">{term}</dt>
          <dd className="mt-1 whitespace-pre-wrap text-pretty text-sm text-muted-foreground">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

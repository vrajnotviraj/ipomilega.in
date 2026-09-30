import type { LucideIcon } from 'lucide-react';

/** Placeholder shown where a section's list would be when it has no items. */
export function EmptyState({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint: string }) {
  return (
    <div className="mt-4 flex items-center gap-4 rounded-xl border border-dashed border-border px-5 py-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-foreground">
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="font-display font-bold tracking-tight text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

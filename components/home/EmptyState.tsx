import type { LucideIcon } from 'lucide-react';

// Sits where a section's list would be, left-aligned with the heading, instead of a floating card.
export function EmptyState({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint: string }) {
  return (
    <div className="mt-4 flex items-center gap-4 rounded-xl border border-dashed border-primary/25 bg-card/70 px-5 py-5 font-sans">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <p className="font-serif font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{hint}</p>
      </div>
    </div>
  );
}

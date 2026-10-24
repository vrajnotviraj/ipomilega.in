import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/server";

const LIST_LIMIT = 5;

const COLUMNS = {
  strengths: { tile: "bg-score-good/8", icon: "text-score-good", Icon: Plus },
  concerns: { tile: "bg-score-bad/8", icon: "text-score-bad", Icon: Minus },
};

/** The top strengths and concerns side by side, each as a stack of tinted tiles. */
export function StrengthsAndConcerns({ strengths, concerns }: { strengths: string[]; concerns: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
      <TileColumn kind="strengths" items={strengths} />
      <TileColumn kind="concerns" items={concerns} />
    </div>
  );
}

function TileColumn({ kind, items }: { kind: keyof typeof COLUMNS; items: string[] }) {
  const { tile, icon, Icon } = COLUMNS[kind];
  const { title, empty } = t().analysis.strengthsAndConcerns[kind];
  const shown = items.slice(0, LIST_LIMIT);

  return (
    <div>
      <h3 className="mb-4 flex items-baseline gap-2 font-display text-lg font-bold tracking-[-0.015em] sm:text-xl">
        {title}
        {shown.length > 0 && <span className="font-mono text-sm font-medium tabular-nums text-muted-foreground">{shown.length}</span>}
      </h3>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="reveal-stagger space-y-2">
          {shown.map((item, index) => (
            <li key={index} className={cn("flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm text-pretty", tile)}>
              <Icon className={cn("mt-0.5 size-3.5 shrink-0", icon)} strokeWidth={2} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

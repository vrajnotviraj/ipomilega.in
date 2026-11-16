import { t } from "@/lib/i18n/server";
import type { Group } from "@/components/shareholder-quota/stages/StageGroups";

/** A link to each stage on the page, with how many IPOs it has. */
export function StageChips({ groups }: { groups: Group[] }) {
  const d = t().quota.sections;
  return (
    <nav aria-label={d.nav}>
      <ul className="flex flex-wrap gap-1.5">
        {groups.map(({ id, ipos }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="press inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground hover:bg-secondary active:bg-secondary motion-reduce:active:transform-none"
            >
              {d[id].title}
              <span className="font-mono tabular-nums text-muted-foreground">{ipos.length}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

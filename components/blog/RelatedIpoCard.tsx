import type { IpoLink } from "@/lib/queries/ipos";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { IpoLogo } from "@/components/ipo/IpoLogo";

/** The IPO a post is about: logo, board and issue size, with a link to its analysis once it has one. */
export function RelatedIpoCard({ ipo }: { ipo: IpoLink }) {
  return (
    // A container query, not a breakpoint: the card sits in the article column on phones and in the narrow sidebar from lg.
    <aside aria-label={`About the ${ipo.name} IPO`} className="@container rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div className="flex items-center gap-4">
          <IpoLogo src={ipo.logo} name={ipo.name} size="lg" />
          <div>
            <p className="mb-1 font-display text-lg font-bold leading-[1.2] tracking-[-0.015em] text-balance">{ipo.name} IPO</p>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {ipo.board && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium uppercase tracking-[0.04em] text-foreground">{ipo.board}</span>
              )}
              <span className="font-mono tabular-nums">{ipo.issueSize || "Size TBA"}</span>
            </p>
          </div>
        </div>
        <ArrowLink href={ipo.slug ? `/analysis/${ipo.slug}` : "/ipos"} className="self-start @md:self-auto">
          {ipo.slug ? "View analysis" : "See all IPOs"}
        </ArrowLink>
      </div>
    </aside>
  );
}

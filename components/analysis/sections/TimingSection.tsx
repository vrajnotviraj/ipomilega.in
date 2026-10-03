import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import { formatShortDate, getRiskTextColor, scoreBand } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { DotScale, Eyebrow, FactList, Prose, SectionHeading } from "@/components/analysis/primitives";

type Time = IpoComprehensiveAnalysis["time"];

// Market timing in words, on the same bands as the score colour.
const MARKET_TIMING_WORD = { good: "Favourable", mid: "Neutral", bad: "Unfavourable" };

/** Why the market timing does or does not suit the issue and how allotment works, beside the timing facts and milestones. */
export function TimingSection({ analysis }: { analysis: IpoComprehensiveAnalysis }) {
  const time = analysis.time;
  const milestones = (time.key_milestones ?? []).filter((milestone) => milestone.event?.trim());

  return (
    <section id="timing" className="reveal">
      <SectionHeading title="Timing" score={time.score ?? 0} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
        <div className="min-w-0 space-y-8">
          {time.market_timing_assessment && <Prose>{time.market_timing_assessment}</Prose>}
          <FactList
            className="max-w-[65ch]"
            facts={[
              { term: "Time to market", detail: time.time_to_market?.rationale },
              { term: "How allotment works", detail: time.allotment_timeline?.process },
            ]}
          />
        </div>
        <div className="min-w-0 space-y-8">
          <TimingFacts time={time} />
          {milestones.length > 0 && <Milestones milestones={milestones} />}
        </div>
      </div>
    </section>
  );
}

/** Market timing in words, the time-to-market score on a dot scale, and the exchanges, on a surface panel. */
function TimingFacts({ time }: { time: Time }) {
  const timeScore = time.score ?? 0;
  const timeToMarket = time.time_to_market?.score;
  const exchanges = time.listing_details?.exchanges?.filter(Boolean).join(", ");

  const facts = [
    {
      label: "Market timing",
      value: MARKET_TIMING_WORD[scoreBand(timeScore)],
      className: cn("font-display font-bold", getRiskTextColor(timeScore)),
    },
    {
      label: "Time to market",
      value: timeToMarket == null ? null : <ScoreWithDots score={timeToMarket} />,
      className: getRiskTextColor(timeToMarket ?? 0),
    },
    { label: "Listing on", value: exchanges, className: "font-display font-bold" },
  ].filter((fact) => fact.value);

  return (
    <dl className="divide-y divide-border rounded-[18px] bg-secondary px-5 py-2 sm:px-6">
      {facts.map(({ label, value, className }) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-3">
          <dt>
            <Eyebrow>{label}</Eyebrow>
          </dt>
          <dd className={cn("min-w-0 text-right text-base break-words", className)}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ScoreWithDots({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-3">
      <DotScale score={score} />
      <span className="font-mono font-medium tabular-nums">{score.toFixed(1)}</span>
    </span>
  );
}

/** Key dates from the prospectus as a mono date beside each event. */
function Milestones({ milestones }: { milestones: Time["key_milestones"] }) {
  return (
    <div>
      <h3 className="mb-3 font-display text-lg font-bold tracking-[-0.015em] sm:text-xl">Key milestones</h3>
      <ol className="reveal-stagger divide-y divide-border">
        {milestones.map((milestone, index) => (
          <li key={index} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-2.5 text-sm">
            <span className="break-words font-mono tabular-nums text-muted-foreground">{formatMilestoneDate(milestone.date)}</span>
            <span className="text-pretty">{milestone.event}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** "18 Aug 2026" when the date parses, else the date as written. */
function formatMilestoneDate(date: string) {
  const formatted = formatShortDate(date, true);
  if (formatted === "TBA") return date || "TBA";
  return formatted;
}

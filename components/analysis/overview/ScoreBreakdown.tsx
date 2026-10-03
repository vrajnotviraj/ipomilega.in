import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import { overallScoreOf } from "@/lib/seo/share";
import { cn } from "@/lib/utils";
import { getScoreAxes } from "@/components/analysis/analysis-facts";
import { gainColorOnInk, scoreColorOnInk } from "@/lib/ipo-format";
import { DotScale } from "@/components/analysis/primitives";

type Axis = { label: string; score: number };

/** The page's one ink panel: the radar of section scores, each score spelled out on a dot scale, and the gains estimate beside them. */
export function ScoreBreakdown({ analysis }: { analysis: IpoComprehensiveAnalysis }) {
  const axes = getScoreAxes(analysis);
  const gainsPotential = analysis.ipo_details?.approximate_gains_potential ?? 0;
  const gainsRationale = analysis.ipo_details?.gains_rationale?.trim();

  return (
    <div className="grid grid-cols-1 items-center gap-6 rounded-[18px] bg-primary p-5 text-primary-foreground sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-8">
      <div className="flex flex-col items-center">
        <ScoreRadar axes={axes} overallScore={overallScoreOf(analysis)} gainsPotential={gainsPotential} />
        <p className="mt-2 text-center text-xs text-primary-foreground/70">Outer ring: estimated gain</p>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold tracking-[-0.015em] sm:text-xl">How the score adds up</h3>
          <p className="mt-1 text-sm text-primary-foreground/70">The overall score is the average of these five.</p>
          {/* The radar has no axis labels, so the scores behind it are listed here. */}
          <ul className="mt-5 divide-y divide-primary-foreground/10">
            {axes.map((axis) => (
              <li key={axis.label} className={cn("grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 py-2.5 text-sm", scoreColorOnInk(axis.score))}>
                <span className="text-primary-foreground/75">{axis.label}</span>
                <DotScale score={axis.score} />
                <span className="font-mono text-base font-medium tabular-nums">{axis.score.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </div>
        <EstimatedGain gainsPotential={gainsPotential} rationale={gainsRationale} />
      </div>
    </div>
  );
}

/** The fundamentals-only gain estimate as a large signed figure, with the reasoning behind it. */
function EstimatedGain({ gainsPotential, rationale }: { gainsPotential: number; rationale?: string }) {
  return (
    <div className="min-w-0 border-t border-primary-foreground/10 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
      <div className="text-xs font-medium uppercase tracking-[0.04em] text-primary-foreground/70">Estimated gain (fundamentals only)</div>
      <div className={cn("mt-1 font-mono text-4xl font-medium tabular-nums", gainColorOnInk(gainsPotential))}>
        {gainsPotential > 0 ? "+" : ""}
        {gainsPotential}%
      </div>
      {rationale && <p className="mt-4 whitespace-pre-wrap text-pretty text-sm text-primary-foreground/75">{rationale}</p>}
    </div>
  );
}

const SIZE = 240;
const CENTER = SIZE / 2;
const GRID_RADIUS = 78;
const RING_RADIUS = 108;
const GRID_LEVELS = [0.33, 0.66, 1];
const CHALK = "var(--primary-foreground)";

/** Pentagon radar of the section scores, with the overall score in the middle and gains potential as the marigold outer ring. */
function ScoreRadar({ axes, overallScore, gainsPotential }: { axes: Axis[]; overallScore: number; gainsPotential: number }) {
  const pointAt = (index: number, radius: number) => {
    const angle = ((-90 + index * (360 / axes.length)) * Math.PI) / 180;
    return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
  };
  const polygonAt = (radiusOf: (index: number) => number) =>
    axes.map((_, i) => pointAt(i, radiusOf(i))).map((p) => `${p.x},${p.y}`).join(" ");

  const scorePoints = axes.map((axis, i) => pointAt(i, (GRID_RADIUS * Math.min(axis.score, 10)) / 10));
  const ringLength = 2 * Math.PI * RING_RADIUS;
  const ringFilled = Math.max(0, Math.min(100, gainsPotential)) / 100;

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="max-w-full" aria-hidden="true">
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RING_RADIUS}
        fill="none"
        stroke="var(--brand-accent)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={ringLength}
        strokeDashoffset={ringLength * (1 - ringFilled)}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
      />

      {GRID_LEVELS.map((level) => (
        <polygon key={level} points={polygonAt(() => GRID_RADIUS * level)} fill="none" stroke={CHALK} strokeOpacity={0.15} />
      ))}
      {axes.map((axis, i) => {
        const end = pointAt(i, GRID_RADIUS);
        return <line key={axis.label} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke={CHALK} strokeOpacity={0.15} />;
      })}

      <polygon points={scorePoints.map((p) => `${p.x},${p.y}`).join(" ")} fill={CHALK} fillOpacity={0.1} stroke={CHALK} strokeWidth={2} />
      {axes.map((axis, i) => (
        <circle
          key={axis.label}
          cx={scorePoints[i].x}
          cy={scorePoints[i].y}
          r={4}
          className={cn("fill-current", scoreColorOnInk(axis.score))}
          stroke="var(--primary)"
          strokeWidth={1.5}
        />
      ))}

      <text x={CENTER} y={CENTER - 6} textAnchor="middle" fill={CHALK} fillOpacity={0.7} style={{ fontSize: 12, letterSpacing: 1, fontWeight: 500 }}>
        OVERALL
      </text>
      <text x={CENTER} y={CENTER + 22} textAnchor="middle" fill={CHALK} style={{ fontSize: 34, fontWeight: 700, fontFamily: "var(--font-display)" }}>
        {overallScore.toFixed(1)}
      </text>
      <text x={CENTER} y={CENTER + 38} textAnchor="middle" fill={CHALK} fillOpacity={0.7} style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>
        / 10
      </text>
    </svg>
  );
}

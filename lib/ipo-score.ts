import type { HomePageIpoProps } from '@/types/ipo-with-analysis';
import type { IpoComprehensiveAnalysis } from '@/types/ipo-comprehensive-analysis';
import { getDaysUntilClosing, getIpoType, parseGainValue } from '@/lib/ipo-format';

// ---------- Scores ----------

export type ScoreBand = 'good' | 'mid' | 'bad';

/** Which band a 0-10 score falls in: above 6 good, above 3 mid, else bad. */
export const scoreBand = (score: number): ScoreBand => {
  if (score > 6) return 'good';
  if (score > 3) return 'mid';
  return 'bad';
};

const SCORE_TEXT_COLOR: Record<ScoreBand, string> = { good: 'text-score-good', mid: 'text-score-mid', bad: 'text-score-bad' };
const SCORE_WORD: Record<ScoreBand, string> = { good: 'Strong', mid: 'Mixed', bad: 'Weak' };

/** Text colour for a score, by band. */
export const getRiskTextColor = (score: number) => SCORE_TEXT_COLOR[scoreBand(score)];

/** Word for a score, on the same bands as its colour. */
export const getScoreTrustLabel = (score: number): string => SCORE_WORD[scoreBand(score)];

const SCORE_TEXT_COLOR_ON_INK: Record<ScoreBand, string> = { good: 'text-score-good-on-ink', mid: 'text-score-mid-on-ink', bad: 'text-score-bad-on-ink' };

/** Text colour for a score on the ink panel or ticker, by band. */
export const scoreColorOnInk = (score: number) => SCORE_TEXT_COLOR_ON_INK[scoreBand(score)];

/** The mean of the five section scores. */
export function overallScoreOf(
  analysis: Pick<IpoComprehensiveAnalysis, 'fundamentals' | 'risk_meter' | 'performance' | 'flexibility' | 'time'>
): number {
  const sections = [analysis.fundamentals, analysis.risk_meter, analysis.performance, analysis.flexibility, analysis.time];
  return sections.reduce((sum, section) => sum + (section?.score ?? 0), 0) / sections.length;
}

/** An IPO's overall score to one decimal, or 0 when it has no analysis yet. */
export const scoreOf = (item: Pick<HomePageIpoProps, 'analysis'>): number =>
  item.analysis ? Math.round(overallScoreOf(item.analysis) * 10) / 10 : 0;

// ---------- QIB signal ----------
// QIB demand nudges the score by up to 1.5 points. Institutions bid on the closing day, so before it
// the figure is ignored; on the closing day only a bonus applies; after close it counts both ways.
// The feed prints 0 for both "no QIB portion" and "no demand", so a 0x SME QIB is treated as absent.

type QibTier = 'weak' | 'neutral' | 'good' | 'strong';

interface QibSignal {
  qib: number;
  tier: QibTier;
  /** Points added to the score; a negative one is withheld on the closing day. */
  delta: number;
  /** Bidding has closed, so the figure is final. */
  final: boolean;
}

const QIB_TIERS: { min: number; tier: QibTier; delta: number }[] = [
  { min: 50, tier: 'strong', delta: 1.5 },
  { min: 10, tier: 'good', delta: 1 },
  { min: 1, tier: 'neutral', delta: 0 },
  { min: -Infinity, tier: 'weak', delta: -1.5 },
];

/** The QIB signal from the closing day on, or null before it or without a QIB figure. */
export const getQibSignal = (
  ipo: {
    qib_sr?: string;
    subscription_is_provisional?: boolean;
    ipo_type?: string;
    subscription_date_range?: string;
    ipo_details?: { ipo_listing?: string };
    ipo_dates?: { ipo_close_date?: string };
    closing_date?: string;
  } | null | undefined
): QibSignal | null => {
  const qib = parseGainValue(ipo?.qib_sr);
  if (qib === null || qib < 0) return null;
  if (qib === 0 && /sme/i.test(getIpoType(ipo))) return null;

  const daysToClose = getDaysUntilClosing(ipo);
  if (daysToClose === null || daysToClose > 0) return null;

  const final = daysToClose < 0 || ipo?.subscription_is_provisional === false;
  const { tier, delta } = QIB_TIERS.find((t) => qib >= t.min)!;
  return { qib, tier, delta: final ? delta : Math.max(0, delta), final };
};

/** The score with the QIB nudge applied, clamped to 0-10. An IPO with no analysis stays at 0. */
export const applyQibAdjustment = (baseScore: number, signal: QibSignal | null): number => {
  if (!baseScore || !signal || signal.delta === 0) return baseScore;
  return Math.round(Math.min(10, Math.max(0, baseScore + signal.delta)) * 10) / 10;
};

/** The score every page shows: the overall score with the QIB nudge applied. */
export const adjustedScoreOf = (item: Pick<HomePageIpoProps, 'analysis' | 'ipo'>): number =>
  applyQibAdjustment(scoreOf(item), getQibSignal(item.ipo));

/** Colour for the QIB figure. A low closing-day figure may just be early, so it stays neutral. */
export const getQibColor = (signal: QibSignal | null): string => {
  if (signal?.tier === 'strong' || signal?.tier === 'good') return 'text-score-good';
  if (signal?.tier === 'weak' && signal.final) return 'text-score-bad';
  return 'text-foreground';
};

/** Tooltip text: "Analysis score 6.2 +1 for 24x QIB subscription". */
export const describeQibAdjustment = (baseScore: number, signal: QibSignal | null): string => {
  if (!baseScore || !signal || signal.delta === 0) return 'Analysis score';
  const sign = signal.delta > 0 ? '+' : '';
  return `Analysis score ${baseScore} ${sign}${signal.delta} for ${signal.qib}x QIB subscription${signal.final ? '' : ' (closing day)'}`;
};

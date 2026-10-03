import { formatRupees, type UseOfProceeds } from "@/lib/ipo-format";
import { Eyebrow } from "./primitives";

const crore = (value: number) => `${formatRupees(value)} Cr`;

// Ink at falling strengths, so each purpose reads as a part of the company's money; the OFS sits apart in muted grey.
const PURPOSE_SHADES = ["100%", "78%", "58%", "42%", "30%", "20%"];
const shadeOf = (index: number) =>
  `color-mix(in oklab, var(--chart-1) ${PURPOSE_SHADES[Math.min(index, PURPOSE_SHADES.length - 1)]}, var(--card))`;

/** One bar segment: a purpose of the fresh issue, or the offer for sale. */
type Segment = { label: string; amountCr: number | null; share: number | null; color: string };

/**
 * Each purpose's slice of the whole issue, in crores. Amounts come from the prospectus table; a purpose with only a
 * percent is scaled by the fresh issue. The OFS joins the bar when its size is known.
 */
function segmentsOf({ items, freshCr, ofsCr }: UseOfProceeds): Segment[] {
  const purposes = items.map((item, index) => ({
    label: item.purpose,
    amountCr: item.amount_cr ?? (item.percent !== null && freshCr ? (item.percent / 100) * freshCr : null),
    color: shadeOf(index),
  }));
  const withOfs = ofsCr ? [...purposes, { label: "Offer for sale: goes to selling shareholders", amountCr: ofsCr, color: "var(--chart-5)" }] : purposes;
  const total = withOfs.reduce((sum, segment) => sum + (segment.amountCr ?? 0), 0);
  return withOfs.map((segment) => ({ ...segment, share: total && segment.amountCr !== null ? (segment.amountCr / total) * 100 : null }));
}

/** Where the IPO money goes: the company's take against the sellers', then the purposes on one bar with a labelled list. */
export function WhereTheMoneyGoes({ proceeds }: { proceeds: UseOfProceeds }) {
  const { freshCr, ofsCr } = proceeds;

  if (freshCr === 0) {
    return (
      <MoneyPanel>
        <p className="max-w-[65ch] text-pretty text-base">
          This IPO is entirely an offer for sale. The company receives none of the money
          {ofsCr ? <> : all <span className="font-mono tabular-nums">{crore(ofsCr)}</span> goes</> : ", it all goes"} to the selling shareholders.
        </p>
      </MoneyPanel>
    );
  }

  const segments = segmentsOf(proceeds);
  return (
    <MoneyPanel>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-10">
        <dl className="grid grid-cols-2 content-start gap-4 lg:grid-cols-1">
          {freshCr !== null && <Split label="To the company" value={crore(freshCr)} note="Fresh issue" />}
          {ofsCr !== null && <Split label="To selling shareholders" value={crore(ofsCr)} note={ofsCr ? "Offer for sale" : "No offer for sale"} muted />}
        </dl>
        <div className="min-w-0">
          <SegmentBar segments={segments} />
          <PurposeList segments={segments} />
        </div>
      </div>
    </MoneyPanel>
  );
}

function MoneyPanel({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="money-heading" className="rounded-[18px] border border-border bg-card p-5 sm:p-8">
      <h2 id="money-heading" className="mb-5 font-display text-2xl font-bold tracking-[-0.02em] text-balance sm:text-3xl">
        Where the money goes
      </h2>
      {children}
    </section>
  );
}

function Split({ label, value, note, muted = false }: { label: string; value: string; note: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <dt>
        <Eyebrow>{label}</Eyebrow>
      </dt>
      <dd className={`mt-1 break-words font-mono text-2xl font-medium tabular-nums sm:text-3xl ${muted ? "text-muted-foreground" : ""}`}>{value}</dd>
      <dd className="mt-0.5 text-xs text-muted-foreground">{note}</dd>
    </div>
  );
}

/** The whole issue as one 100% bar, a segment per purpose. Decorative: the list below carries the numbers. */
function SegmentBar({ segments }: { segments: Segment[] }) {
  const sized = segments.filter((segment) => segment.share);
  if (sized.length === 0) return null;
  return (
    <div className="mb-5 flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
      {sized.map((segment) => (
        <span key={segment.label} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${segment.share}%`, backgroundColor: segment.color }} />
      ))}
    </div>
  );
}

/** Each purpose with its swatch, amount and share of the issue. */
function PurposeList({ segments }: { segments: Segment[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
      {segments.map((segment) => (
        <li key={segment.label} className="flex items-start gap-3 border-t border-border py-3 text-sm">
          <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} aria-hidden="true" />
          <span className="min-w-0 flex-1 text-pretty">{segment.label}</span>
          <span className="shrink-0 text-right font-mono tabular-nums">
            {segment.amountCr === null ? <span className="text-muted-foreground">Not stated</span> : crore(Math.round(segment.amountCr * 100) / 100)}
            {segment.share !== null && <span className="block text-xs text-muted-foreground">{Math.round(segment.share)}%</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

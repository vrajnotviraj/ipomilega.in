'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Ipo, IpoMarketLot } from '@/types/ipo';
import {
  allotmentCategoriesOf,
  AllotmentCategoryDef,
  getMarketLotRows,
  getAllotmentProbability,
  getProbabilityColor,
  allotmentOddsN,
  getAllotmentRatio,
} from '@/lib/ipo/format';
import { useT } from '@/lib/i18n/client';
import { fill } from '@/lib/i18n/locales';
import { cn } from '@/lib/utils';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

/** Allotment odds and application sizes per investor category. Opens when initialCategory is set, on that category's tab. */
export function AllotmentPredictorModal({
  ipo,
  companyName,
  initialCategory,
  onClose,
}: {
  ipo: Ipo | null;
  companyName: string;
  initialCategory: AllotmentCategoryDef['key'] | null;
  onClose: () => void;
}) {
  const { common: c, ipo: words } = useT();
  const d = words.predictor;
  // The tab the reader picked, else the one the modal opened on.
  const [picked, setPicked] = useState<AllotmentCategoryDef['key'] | null>(null);
  const activeKey = picked ?? initialCategory ?? 'retail';

  const close = () => {
    setPicked(null);
    onClose();
  };

  const categories = allotmentCategoriesOf(ipo);
  const activeCategory = categories.find((category) => category.key === activeKey) ?? categories[0];
  const { subscription, lottery, usesCombinedNii } = getAllotmentRatio(ipo, activeCategory);
  const n = allotmentOddsN(lottery);
  const oddsSentence = n === null ? null : lottery !== null && lottery <= 1 ? d.fullySubscribedNote : fill(d.oddsSentence, { n });
  const lots = getMarketLotRows(ipo?.ipo_market_lot, activeCategory.matchKeyword);

  return (
    <Dialog open={!!initialCategory} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-[-0.015em]">{d.title}</DialogTitle>
          <DialogDescription>{companyName}</DialogDescription>
        </DialogHeader>

        <SegmentedControl
          label={d.categoryLabel}
          options={categories.map((cat) => ({ value: cat.key, label: words.categories[cat.key] }))}
          value={activeKey}
          onChange={setPicked}
          className="[&>button]:flex-1"
        />

        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">{fill(d.subscription, { category: words.categories[activeCategory.key] })}</div>
              <div className="font-mono text-sm font-medium tabular-nums text-foreground">{subscription !== null ? `${subscription}x` : c.na}</div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-xs text-muted-foreground">{d.yourOdds}</div>
              <div className={cn('font-mono text-2xl font-medium tabular-nums', getProbabilityColor(getAllotmentProbability(lottery)))}>
                {n === null ? c.na : fill(c.oneIn, { n })}
              </div>
            </div>
          </div>
          {oddsSentence && <p className="-mt-2 text-sm text-foreground">{oddsSentence}</p>}

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{d.applicationSize}</div>
            <div className="grid grid-cols-2 gap-3">
              <LotTile label={d.minimumLot} lot={lots.min} />
              <LotTile label={d.maximumLot} lot={lots.max} />
            </div>
          </div>

          {usesCombinedNii && <p className="text-xs text-muted-foreground">{d.combinedNiiNote}</p>}
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">{activeKey === 'bhni' ? d.bhniNote : d.lotteryNote}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Shares and amount for one application-size row. */
function LotTile({ label, lot }: { label: string; lot?: IpoMarketLot }) {
  const { common: c, ipo: words } = useT();
  return (
    <div className="rounded-lg bg-secondary p-3">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-medium tabular-nums text-foreground">{lot?.shares ? fill(words.predictor.shares, { shares: lot.shares }) : c.na}</div>
      <div className="font-mono text-xs tabular-nums text-muted-foreground">{lot?.amount ? `₹${lot.amount}` : ''}</div>
    </div>
  );
}

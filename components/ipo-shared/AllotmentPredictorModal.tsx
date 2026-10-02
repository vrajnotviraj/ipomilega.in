'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Ipo, IpoMarketLot } from '@/types/ipo';
import {
  ALLOTMENT_CATEGORIES,
  AllotmentCategoryDef,
  getMarketLotRows,
  getAllotmentProbability,
  getProbabilityColor,
  formatAllotmentOdds,
  describeAllotmentOdds,
  getAllotmentRatio,
  COMBINED_NII_NOTE,
} from '@/lib/ipo-format';
import { cn } from '@/lib/utils';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

const BHNI_NOTE =
  "B-HNI winners get the S-HNI minimum (about ₹2 lakh) by draw of lots, so the odds assume everyone applies at the ₹10 lakh minimum: roughly 5x better than the subscription alone suggests. Applying bigger doesn't raise your chance.";
const LOTTERY_NOTE =
  "Estimated with the standard lottery approximation: at 40x subscription, about 1 in 40 applicants wins. Applying bigger doesn't raise your chance. The registrar's draw decides, and it may differ.";

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
  // The tab the reader picked, else the one the modal opened on.
  const [picked, setPicked] = useState<AllotmentCategoryDef['key'] | null>(null);
  const activeKey = picked ?? initialCategory ?? 'retail';

  const close = () => {
    setPicked(null);
    onClose();
  };

  const activeCategory = ALLOTMENT_CATEGORIES.find((c) => c.key === activeKey)!;
  const { subscription, lottery, usesCombinedNii } = getAllotmentRatio(ipo, activeCategory);
  const oddsSentence = describeAllotmentOdds(lottery);
  const lots = getMarketLotRows(ipo?.ipo_market_lot, activeCategory.matchKeyword);

  return (
    <Dialog open={!!initialCategory} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-[-0.015em]">Allotment predictor</DialogTitle>
          <DialogDescription>{companyName}</DialogDescription>
        </DialogHeader>

        <SegmentedControl
          label="Investor category"
          options={ALLOTMENT_CATEGORIES.map((cat) => ({ value: cat.key, label: cat.label }))}
          value={activeKey}
          onChange={setPicked}
          className="[&>button]:flex-1"
        />

        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Subscription ({activeCategory.label})</div>
              <div className="font-mono text-sm font-medium tabular-nums text-foreground">{subscription !== null ? `${subscription}x` : 'N/A'}</div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-xs text-muted-foreground">Your odds</div>
              <div className={cn('font-mono text-2xl font-medium tabular-nums', getProbabilityColor(getAllotmentProbability(lottery)))}>
                {formatAllotmentOdds(lottery)}
              </div>
            </div>
          </div>
          {oddsSentence && <p className="-mt-2 text-sm text-foreground">{oddsSentence}</p>}

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">Application size</div>
            <div className="grid grid-cols-2 gap-3">
              <LotTile label="Minimum lot" lot={lots.min} />
              <LotTile label="Maximum lot" lot={lots.max} />
            </div>
          </div>

          {usesCombinedNii && <p className="text-xs text-muted-foreground">{COMBINED_NII_NOTE}</p>}
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">{activeKey === 'bhni' ? BHNI_NOTE : LOTTERY_NOTE}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Shares and amount for one application-size row. */
function LotTile({ label, lot }: { label: string; lot?: IpoMarketLot }) {
  return (
    <div className="rounded-lg bg-secondary p-3">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-medium tabular-nums text-foreground">{lot?.shares ? `${lot.shares} shares` : 'N/A'}</div>
      <div className="font-mono text-xs tabular-nums text-muted-foreground">{lot?.amount ? `₹${lot.amount}` : ''}</div>
    </div>
  );
}

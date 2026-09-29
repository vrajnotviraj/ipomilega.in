'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Ipo } from '@/types/ipo';
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

// Opens when initialCategory is set, on that category's tab.
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
  const [activeKey, setActiveKey] = useState<AllotmentCategoryDef['key']>('retail');

  useEffect(() => {
    if (initialCategory) setActiveKey(initialCategory);
  }, [initialCategory]);

  const activeCategory = ALLOTMENT_CATEGORIES.find((c) => c.key === activeKey) || ALLOTMENT_CATEGORIES[0];
  const { subscription: ratio, lottery, usesCombinedNii } = getAllotmentRatio(ipo, activeCategory);
  const probability = getAllotmentProbability(lottery);
  const oddsSentence = describeAllotmentOdds(lottery);
  const lots = getMarketLotRows(ipo?.ipo_market_lot, activeCategory.matchKeyword);

  return (
    <Dialog open={!!initialCategory} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md font-sans">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Allotment Predictor</DialogTitle>
          <DialogDescription>{companyName}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          {ALLOTMENT_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveKey(cat.key)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                activeKey === cat.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-4 pt-1">
          <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Subscription ({activeCategory.label})</div>
              <div className="font-mono text-sm font-semibold text-foreground">{ratio !== null ? `${ratio}x` : 'N/A'}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">Your odds</div>
              <div className={`font-serif text-2xl font-semibold ${getProbabilityColor(probability)}`}>
                {formatAllotmentOdds(lottery)}
              </div>
            </div>
          </div>
          {oddsSentence && <p className="text-sm text-foreground/80 -mt-2">{oddsSentence}</p>}

          <div>
            <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">Application size</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground mb-1">Minimum lot</div>
                <div className="font-mono text-sm font-semibold text-foreground">{lots.min?.shares ? `${lots.min.shares} shares` : 'N/A'}</div>
                <div className="font-mono text-xs text-muted-foreground">{lots.min?.amount ? `₹${lots.min.amount}` : ''}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground mb-1">Maximum lot</div>
                <div className="font-mono text-sm font-semibold text-foreground">{lots.max?.shares ? `${lots.max.shares} shares` : 'N/A'}</div>
                <div className="font-mono text-xs text-muted-foreground">{lots.max?.amount ? `₹${lots.max.amount}` : ''}</div>
              </div>
            </div>
          </div>

          {usesCombinedNii && <p className="text-xs text-muted-foreground/80 italic">{COMBINED_NII_NOTE}</p>}
          <p className="text-xs text-muted-foreground/70 border-t border-border pt-3">
            {activeKey === 'bhni'
              ? 'B-HNI winners get the S-HNI minimum (about ₹2 lakh) by draw of lots, so the odds assume everyone applies at the ₹10 lakh minimum: roughly 5x better than the subscription alone suggests. Applying bigger doesn\'t raise your chance.'
              : 'Estimated with the standard lottery approximation: at 40x subscription, about 1 in 40 applicants wins. Applying bigger doesn\'t raise your chance. The registrar\'s draw decides, and it may differ.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// AllotmentPredictorModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Ipo } from '@/app/models/ipo';
import {
  ALLOTMENT_CATEGORIES,
  AllotmentCategoryDef,
  getMarketLotRows,
  getAllotmentProbability,
  getProbabilityColor,
  parseGainValue,
} from './ipoFormat';

interface AllotmentPredictorModalProps {
  ipo: Ipo | null;
  companyName: string;
  initialCategory: AllotmentCategoryDef['key'] | null;
  onClose: () => void;
}

export function AllotmentPredictorModal({ ipo, companyName, initialCategory, onClose }: AllotmentPredictorModalProps) {
  const [activeKey, setActiveKey] = useState<AllotmentCategoryDef['key']>('retail');

  useEffect(() => {
    if (initialCategory) setActiveKey(initialCategory);
  }, [initialCategory]);

  const isOpen = !!initialCategory;
  const activeCategory = ALLOTMENT_CATEGORIES.find((c) => c.key === activeKey) || ALLOTMENT_CATEGORIES[0];
  const ratio = parseGainValue(ipo?.[activeCategory.ratioField]);
  const probability = getAllotmentProbability(ratio);
  const probabilityColor = getProbabilityColor(probability);
  const lots = getMarketLotRows(ipo?.ipo_market_lot, activeCategory.matchKeyword);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
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
              <div className="text-xs text-muted-foreground mb-1">Estimated allotment chance</div>
              <div className={`font-serif text-2xl font-semibold ${probabilityColor}`}>
                {probability !== null ? `${probability}%` : 'N/A'}
              </div>
            </div>
          </div>

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

          {activeCategory.ratioNote && (
            <p className="text-xs text-muted-foreground/80 italic">{activeCategory.ratioNote}</p>
          )}
          <p className="text-xs text-muted-foreground/70 border-t border-border pt-3">
            Estimated using a standard proportional-lottery approximation (100 ÷ subscription ratio). Actual allotment is decided by the registrar&apos;s lottery and may differ.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { ChevronRight, Landmark, User, Users } from "lucide-react";
import type { Ipo } from "@/types/ipo";
import { AllotmentPredictorModal } from "@/components/ipo/AllotmentPredictorModal";
import {
  ALLOTMENT_CATEGORIES,
  formatAllotmentOdds,
  formatAllotmentPercent,
  getAllotmentProbability,
  getAllotmentRatio,
  getProbabilityColor,
  type AllotmentCategoryDef,
} from "@/lib/ipo-format";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<AllotmentCategoryDef["key"], typeof User> = { retail: User, shni: Users, bhni: Landmark };

const VARIANTS = {
  compact: {
    heading: "mb-1.5 text-xs text-muted-foreground",
    grid: "gap-2",
    tile: "rounded-lg bg-secondary py-2.5 ring-1 ring-transparent transition hover:ring-primary/30",
    chevron: "right-1 top-1 size-3",
    odds: "text-sm",
  },
  card: {
    heading: "mb-3 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground",
    grid: "gap-2 sm:gap-3",
    tile: "card-lift rounded-xl border border-border bg-card py-3",
    chevron: "right-1.5 top-1.5 size-3.5",
    odds: "text-base sm:text-lg",
  },
};

/**
 * One odds tile per investor category, each opening the allotment predictor on its category.
 * Until subscription numbers come in it shows a one-line hint instead. The caption shows only with odds.
 */
export function AllotmentOddsTiles({
  ipo,
  companyName,
  format,
  variant,
  heading,
  caption,
}: {
  ipo: Ipo | null;
  companyName: string;
  format: "percent" | "ratio";
  variant: keyof typeof VARIANTS;
  heading: string;
  caption?: string;
}) {
  const [openCategory, setOpenCategory] = useState<AllotmentCategoryDef["key"] | null>(null);
  const style = VARIANTS[variant];

  const categories = ALLOTMENT_CATEGORIES.map((category) => {
    const { lottery } = getAllotmentRatio(ipo, category);
    return {
      ...category,
      Icon: CATEGORY_ICONS[category.key],
      odds: format === "percent" ? formatAllotmentPercent(lottery) : formatAllotmentOdds(lottery),
      oddsColor: getProbabilityColor(getAllotmentProbability(lottery)),
    };
  });

  if (categories.every((category) => category.odds === "N/A")) {
    return <p className="text-xs text-muted-foreground">Allotment odds show up once subscription numbers come in.</p>;
  }

  return (
    <div data-tour="odds">
      <div className={style.heading}>{heading}</div>
      <div className={cn("grid grid-cols-3", style.grid)}>
        {categories.map(({ key, label, Icon, odds, oddsColor }) => (
          <button
            key={key}
            type="button"
            onClick={() => setOpenCategory(key)}
            className={cn("group relative flex flex-col items-center gap-1 text-center active:scale-[0.98]", style.tile)}
          >
            <ChevronRight
              className={cn("absolute text-muted-foreground transition-transform group-hover:translate-x-0.5", style.chevron)}
              strokeWidth={2}
            />
            <Icon className="size-3.5 text-muted-foreground" strokeWidth={2} />
            <span className={cn("whitespace-nowrap font-mono font-medium tabular-nums", style.odds, oddsColor)}>{odds}</span>
            <span className="text-xs font-medium uppercase leading-tight tracking-[0.04em] text-muted-foreground">{label}</span>
            <span className="sr-only">allotment odds, show details</span>
          </button>
        ))}
      </div>
      {caption && <p className="mt-2 text-xs text-muted-foreground">{caption}</p>}

      <AllotmentPredictorModal ipo={ipo} companyName={companyName} initialCategory={openCategory} onClose={() => setOpenCategory(null)} />
    </div>
  );
}

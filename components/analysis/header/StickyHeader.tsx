"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { IpoLogo } from "@/components/ipo-shared/IpoLogo";
import { ShareButton } from "@/components/ui/ShareButton";
import { buildShareMessage, type ShareFacts } from "@/lib/seo/share";
import { getRiskTextColor } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import type { SectionTab } from "@/components/analysis/analysis-facts";
import { useActiveSection, useStickyTop } from "@/components/analysis/header/useSectionNav";

const iconButton =
  "grid size-9 shrink-0 place-items-center rounded-full border border-border transition-colors hover:bg-secondary active:scale-[0.98]";

/** Back button, company name, share, and the section tabs, pinned under the site header. */
export function StickyHeader({
  companyName,
  logoUrl,
  tabs,
  shareFacts,
}: {
  companyName: string;
  logoUrl?: string;
  tabs: SectionTab[];
  shareFacts: ShareFacts;
}) {
  const stickyRef = useRef<HTMLDivElement>(null);
  const top = useStickyTop(stickyRef);

  return (
    <div ref={stickyRef} className="sticky z-40 border-b border-border bg-background/95 backdrop-blur" style={{ top }}>
      <div className="app-container flex items-center justify-between gap-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <BackButton />
          <IpoLogo src={logoUrl} name={companyName} size="sm" />
          <span className="truncate font-display text-sm font-bold">{companyName}</span>
        </div>
        <ShareButton title={`${companyName} IPO`} text={buildShareMessage(shareFacts)} />
      </div>
      <SectionTabs tabs={tabs} />
    </div>
  );
}

/**
 * Goes back when the visitor came from within the site, otherwise home.
 */
function BackButton() {
  const router = useRouter();

  function cameFromThisSite() {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const withoutHash = (url: string) => url.split("#")[0];
    const navigatedInApp = !!entry?.name && withoutHash(entry.name) !== withoutHash(window.location.href);
    if (navigatedInApp) return true;

    try {
      return !!document.referrer && new URL(document.referrer).origin === window.location.origin;
    } catch {
      return false;
    }
  }

  return (
    <button onClick={() => (cameFromThisSite() ? router.back() : router.push("/"))} className={iconButton} aria-label="Go back">
      <ArrowLeft className="size-4" strokeWidth={2} />
    </button>
  );
}

/** Horizontal tab strip that follows the scroll position and keeps the active tab in view. */
function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const { active, jumpTo } = useActiveSection(tabs.map((tab) => tab.key));
  const barRef = useRef<HTMLDivElement>(null);

  // Scroll only the tab bar; scrollIntoView would move the page too.
  useEffect(() => {
    const bar = barRef.current;
    const tab = bar?.querySelector<HTMLElement>(`[data-section="${active}"]`);
    if (!bar || !tab) return;
    bar.scrollTo({ left: Math.max(0, tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2), behavior: "smooth" });
  }, [active]);

  return (
    <div ref={barRef} className="app-container overflow-x-auto">
      <div className="flex min-w-max items-center gap-1 pb-3">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              data-section={tab.key}
              aria-current={isActive ? "true" : undefined}
              onClick={() => jumpTo(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors active:scale-[0.98]",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.score !== undefined && (
                <span className={cn("font-mono text-xs tabular-nums", !isActive && getRiskTextColor(tab.score))}>
                  {tab.score.toFixed(1)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

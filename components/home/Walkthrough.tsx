'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

const PAD = 6;
const GUTTER = 16;
const TIP_WIDTH = 300;

interface Step {
  target: string;
  title: string;
  body: string;
}

/** Tour steps in page order, each pointing at a `data-tour` element. */
const STEPS: Step[] = [
  {
    target: 'board-tabs',
    title: 'Mainboard or SME',
    body: 'Switch between regular IPOs and small-company (SME) IPOs.',
  },
  {
    target: 'ipo-name',
    title: 'Tap the name for full analysis',
    body: 'Underlined names open the detailed report: financials, risks and our score.',
  },
  {
    target: 'demand',
    title: 'GMP and demand',
    body: 'GMP is the unofficial grey market premium, a rough guide to the listing gain. QIB is big-institution demand. A high QIB on the last day is a strong sign.',
  },
  {
    target: 'odds',
    title: 'Your allotment odds',
    body: '"1 in 40" means about 1 out of every 40 applicants gets shares. Tap any box to see the details.',
  },
  {
    target: 'check-allotment',
    title: 'Closed IPOs',
    body: 'Bidding is over for these. Once allotment is out, tap "Check allotment" to see if you got shares.',
  },
];

const findTarget = (step: Step): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);

/** A "Take a quick tour" button that walks through the home page. Steps whose target is missing are left out. */
export function Walkthrough() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const start = () => {
    setIndex(0);
    setSteps(STEPS.filter((s) => findTarget(s)));
  };

  const step = steps[index];
  const active = !!step;

  // Measures the target every frame because iOS Safari keeps moving it after the last scroll event.
  useLayoutEffect(() => {
    if (!step) return;
    findTarget(step)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    let frame = 0;
    let last = '';
    const track = () => {
      const el = findTarget(step);
      const r = el ? el.getBoundingClientRect() : null;
      const key = r ? `${Math.round(r.top)},${Math.round(r.left)},${Math.round(r.width)},${Math.round(r.height)}` : '';
      if (key !== last) {
        last = key;
        setRect(r);
      }
      frame = requestAnimationFrame(track);
    };
    track();
    return () => cancelAnimationFrame(frame);
  }, [step]);

  const finish = useCallback(() => setSteps([]), []);

  const next = useCallback(() => {
    if (index + 1 >= steps.length) finish();
    else setIndex(index + 1);
  }, [index, steps.length, finish]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      // Enter is left to the focused Next button, or it would advance two steps.
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, next, finish]);

  const trigger = (
    <button
      type="button"
      onClick={start}
      className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground press hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Compass className="size-4" strokeWidth={2} aria-hidden />
      Take a quick tour
    </button>
  );
  if (!active) return trigger;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tipWidth = Math.min(TIP_WIDTH, vw - GUTTER * 2);

  // Tooltip goes below the target when there's room, otherwise above it.
  let tipTop = vh / 2 - 80;
  let tipLeft = (vw - tipWidth) / 2;
  if (rect) {
    const below = rect.bottom + PAD + 12;
    tipTop = below + 170 < vh ? below : Math.max(GUTTER, rect.top - PAD - 12 - 170);
    tipLeft = Math.min(Math.max(GUTTER, rect.left + rect.width / 2 - tipWidth / 2), vw - tipWidth - GUTTER);
  }

  const isLast = index === steps.length - 1;

  return (
    <>
      {trigger}
      {createPortal(
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Quick tour">
          {/* Blocks clicks to the page while the tour is up. */}
          <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

          {rect ? (
            <div
              className="pointer-events-none absolute rounded-xl ring-2 ring-brand-accent"
              style={{
                top: 0,
                left: 0,
                transform: `translate(${rect.left - PAD}px, ${rect.top - PAD}px)`,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
                boxShadow: '0 0 0 9999px color-mix(in srgb, var(--primary) 60%, transparent)',
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-primary/60" />
          )}

          <div
            className="absolute rounded-xl border border-border bg-card p-4 text-card-foreground shadow-(--shadow-lift)"
            style={{ top: 0, left: 0, transform: `translate(${tipLeft}px, ${tipTop}px)`, width: tipWidth }}
          >
            <div className="mb-1 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
              Quick tour <span className="font-mono tabular-nums">{index + 1}/{steps.length}</span>
            </div>
            <h3 className="mb-1 font-display text-lg font-bold tracking-[-0.015em]">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            <div className="flex items-center justify-between mt-4">
              <Button variant="ghost" onClick={() => finish()} className="-ml-4 text-muted-foreground hover:text-foreground">
                Skip tour
              </Button>
              <Button onClick={next} autoFocus>
                {isLast ? 'Got it' : 'Next'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

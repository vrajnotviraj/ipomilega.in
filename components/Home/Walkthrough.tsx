'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * First-visit tour of the home page. Testers tapped around, saw nothing obvious happen, and
 * decided the cards weren't interactive -- this points at the parts that are.
 *
 * Shown once. "Skip" and finishing both write the same flag, so a skipped tour never comes back.
 * Steps are anchored by `data-tour="..."` attributes and only run when their element is on the
 * page (no live IPOs -> no card steps). If none are present the flag is left unset, so the tour
 * waits for a day when there is something to show.
 */

const STORAGE_KEY = 'ipomilega:walkthrough';
const PAD = 6;
const GUTTER = 16;
const TIP_WIDTH = 300;

interface Step {
  target: string;
  title: string;
  body: string;
}

// In page order, so the tour scrolls steadily downward.
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
    body: 'GMP is the expected listing gain. QIB is big-institution demand. A high QIB on the last day is a strong sign.',
  },
  {
    target: 'odds',
    title: 'Your allotment odds',
    body: '"1 in 40" means about 1 out of every 40 applicants gets shares. Tap any box to see the details.',
  },
  {
    target: 'check-odds',
    title: 'Closed IPOs',
    body: 'Bidding is over for these. Tap "Check odds" to see your chances before allotment day.',
  },
];

const readFlag = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeFlag = (value: string) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Private mode / blocked storage: the tour may show again next visit, which is harmless.
  }
};

const findTarget = (step: Step): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);

export function Walkthrough() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Decide on mount whether to run. Waits a beat so the page's entrance animation settles and
  // the cards are laid out before anything is measured.
  useEffect(() => {
    if (readFlag()) return;
    const timer = window.setTimeout(() => {
      const available = STEPS.filter((s) => findTarget(s));
      if (available.length) setSteps(available);
    }, 900);
    return () => window.clearTimeout(timer);
  }, []);

  const step = steps[index];
  const active = !!step;

  const measure = useCallback(() => {
    if (!step) return;
    const el = findTarget(step);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  // Bring the current target into view, then keep the spotlight glued to it.
  useLayoutEffect(() => {
    if (!step) return;
    findTarget(step)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    measure();
    const settle = window.setTimeout(measure, 400);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, measure]);

  const finish = useCallback((how: 'skipped' | 'done') => {
    writeFlag(how);
    setSteps([]);
  }, []);

  const next = useCallback(() => {
    if (index + 1 >= steps.length) finish('done');
    else setIndex(index + 1);
  }, [index, steps.length, finish]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish('skipped');
      // Enter is left to the focused Next button; handling it here too advanced two steps.
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, next, finish]);

  if (!active || typeof document === 'undefined') return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tipWidth = Math.min(TIP_WIDTH, vw - GUTTER * 2);

  // Tooltip sits below the target when there's room, otherwise above it.
  let tipTop = vh / 2 - 80;
  let tipLeft = (vw - tipWidth) / 2;
  if (rect) {
    const below = rect.bottom + PAD + 12;
    tipTop = below + 170 < vh ? below : Math.max(GUTTER, rect.top - PAD - 12 - 170);
    tipLeft = Math.min(Math.max(GUTTER, rect.left + rect.width / 2 - tipWidth / 2), vw - tipWidth - GUTTER);
  }

  const isLast = index === steps.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[100] font-sans" role="dialog" aria-modal="true" aria-label="Quick tour">
      {/* Blocks clicks to the page while the tour is up. */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {rect ? (
        <div
          className="absolute rounded-xl ring-2 ring-primary pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}

      <div
        className="absolute rounded-xl border border-border bg-card text-card-foreground shadow-xl p-4 transition-all duration-300 ease-out"
        style={{ top: tipTop, left: tipLeft, width: tipWidth }}
      >
        <div className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground mb-1">
          Quick tour · {index + 1}/{steps.length}
        </div>
        <h3 className="font-serif text-base font-semibold text-foreground mb-1">{step.title}</h3>
        <p className="text-sm text-foreground/80 leading-relaxed">{step.body}</p>
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => finish('skipped')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
          <button
            onClick={next}
            autoFocus
            className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium hover:opacity-90 active:scale-[0.97] transition-all"
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

"use client";

import { createContext, useContext, useState, useEffect, useRef, Suspense, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const PARKED_AT = 85;
const TICK_MS = 150;
const GIVE_UP_MS = 10_000;
const FADE_MS = 300;

const ProgressContext = createContext<{ startProgress: () => void } | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress must be used within a ProgressProvider");
  return context;
};

/** Calls onRouteChange when the path or query changes. Own <Suspense> so useSearchParams doesn't opt pages out of SSR. */
const RouteChangeWatcher = ({ onRouteChange }: { onRouteChange: () => void }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handler = useRef(onRouteChange);
  handler.current = onRouteChange;

  useEffect(() => {
    handler.current();
  }, [pathname, searchParams]);

  return null;
};

/** Moves quickly at first, then slows as it nears the parked position. */
function nextStep(progress: number) {
  return Math.min(PARKED_AT, progress + Math.max(0.5, (PARKED_AT - progress) * 0.12));
}

/** Shows a top progress bar from startProgress() until the route changes, or 10s pass. */
export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const [progress, setProgress] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const finishProgress = () => {
    clearTimers();
    setProgress(100);
    timers.current.push(setTimeout(() => setProgress(null), FADE_MS));
  };

  const startProgress = () => {
    clearTimers();
    setProgress(0);
    timers.current.push(
      setInterval(() => setProgress((p) => nextStep(p ?? 0)), TICK_MS),
      setTimeout(finishProgress, GIVE_UP_MS)
    );
  };

  const isNavigating = progress !== null && progress < 100;

  return (
    <ProgressContext.Provider value={{ startProgress }}>
      <Suspense fallback={null}>
        <RouteChangeWatcher onRouteChange={() => { if (isNavigating) finishProgress(); }} />
      </Suspense>
      {progress !== null && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5" aria-hidden="true">
          <div
            className="h-full bg-primary transition-[width,opacity] duration-200 ease-(--ease-out)"
            style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
          />
        </div>
      )}
      {children}
    </ProgressContext.Provider>
  );
};

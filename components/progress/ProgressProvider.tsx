"use client";

import { createContext, useContext, useState, useEffect, useRef, Suspense, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const ProgressContext = createContext<{ startProgress: () => void } | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used within a ProgressProvider');
  return context;
};

// Kept in its own <Suspense>: useSearchParams would otherwise opt every page out of server rendering.
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

/** Shows a top progress bar from startProgress() until the route changes, or 10s pass. */
export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const tickInterval = useRef<ReturnType<typeof setInterval>>(undefined);
  const fallbackTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clearTimers = () => {
    clearInterval(tickInterval.current);
    clearTimeout(fallbackTimeout.current);
  };

  useEffect(() => clearTimers, []);

  const completeProgress = () => {
    clearTimers();
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 300);
  };

  const finishNavigation = () => {
    completeProgress();
    setIsNavigating(false);
  };

  const startProgress = () => {
    clearTimers();
    setIsLoading(true);
    setIsNavigating(true);
    setProgress(0);

    // Fast at first, slowing down, then parked at 85% until the page arrives.
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        const increment = prev < 30 ? Math.random() * 15 : prev < 60 ? Math.random() * 8 : Math.random() * 3;
        return Math.min(prev + increment, 85);
      });
    }, 150);
    tickInterval.current = interval;
    fallbackTimeout.current = setTimeout(finishNavigation, 10000);
  };

  return (
    <ProgressContext.Provider value={{ startProgress }}>
      <Suspense fallback={null}>
        <RouteChangeWatcher onRouteChange={() => { if (isNavigating) finishNavigation(); }} />
      </Suspense>
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 pointer-events-none" aria-hidden="true">
          <div
            className="h-full bg-primary transition-[width,opacity] duration-200 ease-out"
            style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1, boxShadow: '0 0 8px 0 var(--primary)' }}
          />
        </div>
      )}
      {children}
    </ProgressContext.Provider>
  );
};

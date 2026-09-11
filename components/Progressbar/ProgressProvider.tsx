"use client";

import React, { createContext, useContext, useState, useEffect, useRef, Suspense, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface ProgressContextType {
  startProgress: () => void;
  completeProgress: () => void;
  isLoading: boolean;
  progress: number;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

// Progress Bar Component
const ProgressBar = () => {
  const { isLoading, progress } = useProgress();

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 pointer-events-none" aria-hidden="true">
      <div
        className="h-full bg-primary transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
          // A short bright tail on the leading edge reads as motion without the heavy glow the
          // old hardcoded blue bar used.
          boxShadow: '0 0 8px 0 var(--primary)',
        }}
      />
    </div>
  );
};

// Extend Window interface to include our custom property
declare global {
  interface Window {
    progressInterval?: NodeJS.Timeout;
    progressCompleteTimeout?: NodeJS.Timeout;
  }
}

/**
 * Watches the current route and reports when it changes.
 *
 * This exists purely to quarantine `useSearchParams`. That hook cannot be evaluated while a
 * route is being prerendered, so React bails the nearest Suspense boundary out to client-side
 * rendering. ProgressProvider wraps the whole application, so calling the hook directly in it
 * meant *every* page -- homepage included -- shipped an empty <body> and painted nothing until
 * the JS bundle had downloaded, parsed and re-rendered the entire tree in the browser.
 *
 * Isolated behind its own <Suspense> and rendering null, the bail-out now costs nothing: the
 * rest of the tree still streams as server-rendered HTML.
 */
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

export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleRouteChange = () => {
    if (isNavigating) {
      // Page has loaded, complete the progress
      completeProgress();
      setIsNavigating(false);
    }
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (window.progressInterval) {
        clearInterval(window.progressInterval);
        window.progressInterval = undefined;
      }
      if (window.progressCompleteTimeout) {
        clearTimeout(window.progressCompleteTimeout);
        window.progressCompleteTimeout = undefined;
      }
    };
  }, []);

  const startProgress = () => {
    // Clear any existing intervals/timeouts
    if (window.progressInterval) {
      clearInterval(window.progressInterval);
      window.progressInterval = undefined;
    }
    if (window.progressCompleteTimeout) {
      clearTimeout(window.progressCompleteTimeout);
      window.progressCompleteTimeout = undefined;
    }

    setIsLoading(true);
    setIsNavigating(true);
    setProgress(0);
    
    // Simulate progress - more realistic progression
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          // Slow down near the end, wait for actual page load
          clearInterval(interval);
          window.progressInterval = undefined;
          return 85;
        }
        // Faster initial progress, then slower
        const increment = prev < 30 ? Math.random() * 15 : 
                         prev < 60 ? Math.random() * 8 : 
                         Math.random() * 3;
        return Math.min(prev + increment, 85);
      });
    }, 150);

    window.progressInterval = interval;

    // Fallback: complete after 10 seconds even if page doesn't load
    window.progressCompleteTimeout = setTimeout(() => {
      completeProgress();
      setIsNavigating(false);
    }, 10000);
  };

  const completeProgress = () => {
    // Clear any existing intervals/timeouts
    if (window.progressInterval) {
      clearInterval(window.progressInterval);
      window.progressInterval = undefined;
    }
    if (window.progressCompleteTimeout) {
      clearTimeout(window.progressCompleteTimeout);
      window.progressCompleteTimeout = undefined;
    }
    
    // Quickly complete to 100%
    setProgress(100);
    
    // Hide progress bar after completion animation
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 300);
  };

  return (
    <ProgressContext.Provider value={{ startProgress, completeProgress, isLoading, progress }}>
      <Suspense fallback={null}>
        <RouteChangeWatcher onRouteChange={handleRouteChange} />
      </Suspense>
      <ProgressBar />
      {children}
    </ProgressContext.Provider>
  );
};
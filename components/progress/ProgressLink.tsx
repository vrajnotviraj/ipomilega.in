"use client";

import { useEffect, useRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useProgressRouter } from "@/components/progress/useProgressRouter";
import { useLocale } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/locales";

type ProgressLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

// Long enough after render that prefetches never compete with the page's own requests or its Lighthouse metrics.
const PREFETCH_DELAY_MS = 3000;

/** True when the browser should handle the click itself: a new-tab click or a same-page anchor. */
export function isNativeClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
  return href.startsWith("#") || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || e.currentTarget.target === "_blank";
}

/** Prefetches the link's page once it is on screen, a few seconds after render and when the browser is idle. The fetch also re-renders a stale ISR page on the server; pages already cached are skipped by the router. */
function usePrefetchWhenSeen(href: string) {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const link = ref.current;
    const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!link || saveData || href.startsWith("#")) return;

    const whenIdle = window.requestIdleCallback ?? setTimeout;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      whenIdle(() => router.prefetch(href));
    });
    const timer = setTimeout(() => observer.observe(link), PREFETCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [href, router]);

  return ref;
}

/** An <a> that navigates client-side and shows the progress bar. Site paths get the page's language prefix. */
export const ProgressLink = ({ href: sitePath, onClick, ...props }: ProgressLinkProps) => {
  const router = useProgressRouter();
  const href = localePath(useLocale(), sitePath);
  const ref = usePrefetchWhenSeen(href);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || isNativeClick(e, href)) return;
    e.preventDefault();
    router.push(sitePath);
  };

  return <a ref={ref} href={href} onClick={handleClick} {...props} />;
};

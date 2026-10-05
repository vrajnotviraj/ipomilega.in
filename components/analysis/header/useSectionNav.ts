import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Keeps the sticky page header just below the site header, and sets scroll-padding so anchor jumps clear both.
 * Measures both, since their heights change per breakpoint.
 */
export function useStickyTop(stickyRef: RefObject<HTMLElement | null>) {
  const [top, setTop] = useState(64);

  useEffect(() => {
    const siteHeader = document.querySelector("header.fixed");
    const root = document.documentElement;

    function measure() {
      const siteHeaderHeight = siteHeader?.getBoundingClientRect().height ?? 64;
      setTop(siteHeaderHeight);
      root.style.scrollPaddingTop = `${siteHeaderHeight + (stickyRef.current?.offsetHeight ?? 0) + 12}px`;
    }

    measure();
    const observer = new ResizeObserver(measure);
    if (siteHeader) observer.observe(siteHeader);
    if (stickyRef.current) observer.observe(stickyRef.current);

    return () => {
      observer.disconnect();
      root.style.scrollPaddingTop = "";
    };
  }, [stickyRef]);

  return top;
}

/** A section's top in page coordinates, from layout so the .reveal entry animation's shift doesn't count. */
function layoutTop(el: HTMLElement) {
  let top = 0;
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) top += node.offsetTop;
  return top;
}

/** Tracks which section the reader is on, and scrolls to a section on request. */
export function useActiveSection(keys: string[]) {
  const [active, setActive] = useState(keys[0]);
  // Paused during a tab's smooth scroll, so the tabs it passes do not flash.
  const pausedUntil = useRef(0);

  useEffect(() => {
    let frame = 0;
    let resumeTimer = 0;

    function sectionUnderHeader() {
      const sections = keys.map((key) => document.getElementById(key)).filter((el): el is HTMLElement => el !== null);
      if (!sections.length) return null;

      // The last sections are often too short to ever reach the line.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) return sections[sections.length - 1].id;

      // A section counts as current once its top reaches the upper third of the space below the sticky header.
      const headerBottom = parseFloat(document.documentElement.style.scrollPaddingTop) || 160;
      const line = headerBottom + (window.innerHeight - headerBottom) / 3;
      const passed = sections.filter((el) => layoutTop(el) - window.scrollY <= line);
      return (passed[passed.length - 1] ?? sections[0]).id;
    }

    function update() {
      frame = 0;
      const wait = pausedUntil.current - Date.now();
      if (wait > 0) {
        // Try again once scrolling has been quiet for a moment.
        pausedUntil.current = Math.max(pausedUntil.current, Date.now() + 150);
        window.clearTimeout(resumeTimer);
        resumeTimer = window.setTimeout(update, pausedUntil.current - Date.now() + 10);
        return;
      }
      const current = sectionUnderHeader();
      if (current) setActive(current);
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(resumeTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // The key list is fixed for the page's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function jumpTo(key: string) {
    setActive(key);
    pausedUntil.current = Date.now() + 900;
    const section = document.getElementById(key);
    if (!section) return;
    // Scrolls to the layout position; scrollIntoView would include the .reveal shift and hide the heading under the header.
    const headerBottom = parseFloat(document.documentElement.style.scrollPaddingTop) || 0;
    window.scrollTo({ top: layoutTop(section) - headerBottom, behavior: "smooth" });
  }

  return { active, jumpTo };
}

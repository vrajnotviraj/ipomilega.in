"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useProgressRouter } from "@/components/progress/useProgressRouter";

type ProgressLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** True when the browser should handle the click itself: a new-tab click or a same-page anchor. */
function isNativeClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
  return href.startsWith("#") || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || e.currentTarget.target === "_blank";
}

/** An <a> that navigates client-side and shows the progress bar. */
export const ProgressLink = ({ href, onClick, ...props }: ProgressLinkProps) => {
  const router = useProgressRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || isNativeClick(e, href)) return;
    e.preventDefault();
    router.push(href);
  };

  return <a href={href} onClick={handleClick} {...props} />;
};

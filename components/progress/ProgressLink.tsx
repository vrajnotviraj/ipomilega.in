"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useProgressRouter } from "@/components/progress/useProgressRouter";
import { useLocale } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/locales";

type ProgressLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** True when the browser should handle the click itself: a new-tab click or a same-page anchor. */
export function isNativeClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
  return href.startsWith("#") || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || e.currentTarget.target === "_blank";
}

/** An <a> that navigates client-side and shows the progress bar. Site paths get the page's language prefix. */
export const ProgressLink = ({ href: sitePath, onClick, ...props }: ProgressLinkProps) => {
  const router = useProgressRouter();
  const href = localePath(useLocale(), sitePath);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || isNativeClick(e, href)) return;
    e.preventDefault();
    router.push(sitePath);
  };

  return <a href={href} onClick={handleClick} {...props} />;
};

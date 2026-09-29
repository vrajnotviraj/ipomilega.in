"use client";

import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { useProgressRouter } from '@/hooks/useProgressRouter';

type ProgressLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** An <a> that navigates client-side and shows the progress bar. */
export const ProgressLink = ({ href, onClick, ...props }: ProgressLinkProps) => {
  const router = useProgressRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClick?.(e);
    router.push(href);
  };

  return <a href={href} onClick={handleClick} {...props} />;
};

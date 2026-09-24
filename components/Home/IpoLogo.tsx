'use client';

import { useState } from 'react';

const SIZES = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
} as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

/**
 * Company logo for cards and rows. The scraper pulls logos out of the RHP's first page, so
 * some IPOs have none and a few S3 objects 404 -- both fall back to the company's initials
 * rather than a broken-image icon. White tile in both themes: most extracted logos are JPEGs
 * drawn on white, which would sit in a visible box on a dark card anyway.
 */
export function IpoLogo({
  src,
  name,
  size = 'md',
  className = '',
}: {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = src?.trim();
  const showImage = !!url && !failed;

  return (
    <span
      className={`${SIZES[size]} flex-shrink-0 inline-flex items-center justify-center rounded-md border border-border overflow-hidden font-mono font-semibold ${
        showImage ? 'bg-white' : 'bg-secondary text-foreground/70'
      } ${className}`}
      aria-hidden="true"
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- tiny S3 logos; next/image would need every bucket host whitelisted
        <img src={url} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} className="w-full h-full object-contain p-0.5" />
      ) : (
        initials(name || '') || '?'
      )}
    </span>
  );
}

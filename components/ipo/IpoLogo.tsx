'use client';

import Image from 'next/image';
import { useState } from 'react';

const SIZES = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
} as const;

// Only the scraper's bucket is allowed in next.config; other hosts skip the optimizer.
const OPTIMIZABLE = 'https://ipomilega-assests.s3.ap-south-1.amazonaws.com/';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

// Company logo tile, falling back to initials when there is no logo or it fails to load.
// White in both themes because most extracted logos are JPEGs drawn on white.
export function IpoLogo({
  src,
  name,
  size = 'md',
}: {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof SIZES;
}) {
  const [failed, setFailed] = useState(false);
  const url = src?.trim();
  const showImage = !!url && !failed;

  return (
    <span
      className={`${SIZES[size]} flex-shrink-0 inline-flex items-center justify-center rounded-md border border-border overflow-hidden font-mono font-semibold ${
        showImage ? 'bg-white' : 'bg-secondary text-foreground/70'
      }`}
      aria-hidden="true"
    >
      {showImage ? (
        // Through the optimizer: the bucket sends no Cache-Control and some logos are full-size PNGs.
        <Image
          src={url}
          alt=""
          width={44}
          height={44}
          unoptimized={!url.startsWith(OPTIMIZABLE)}
          onError={() => setFailed(true)}
          className="w-full h-full object-contain p-0.5"
        />
      ) : (
        initials(name || '') || '?'
      )}
    </span>
  );
}

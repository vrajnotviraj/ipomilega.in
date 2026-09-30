'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn, getInitials } from '@/lib/utils';

const SIZES = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
} as const;

// Only the scraper's bucket is allowed in next.config; other hosts skip the optimizer.
const OPTIMIZABLE = 'https://ipomilega-assests.s3.ap-south-1.amazonaws.com/';

/** Company logo tile on white (most logos are JPEGs drawn on white), falling back to initials when there is no logo or it fails to load. */
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
      className={cn(
        SIZES[size],
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border font-mono font-medium',
        showImage ? 'bg-card' : 'bg-secondary text-muted-foreground'
      )}
      aria-hidden="true"
    >
      {showImage ? (
        // Through the optimizer: the bucket sends no Cache-Control and some logos are full-size PNGs.
        <Image
          src={url}
          // The tile is aria-hidden, so screen readers skip this; image search and SEO tools read it.
          alt={name ? `${name} logo` : ""}
          width={44}
          height={44}
          unoptimized={!url.startsWith(OPTIMIZABLE)}
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-0.5"
        />
      ) : (
        getInitials(name || '') || '?'
      )}
    </span>
  );
}

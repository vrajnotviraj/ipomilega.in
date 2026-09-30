import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { SITE_DATA_TAG } from '@/lib/db/cache';

export const dynamic = 'force-dynamic';

const digest = (value: string) => createHash('sha256').update(value).digest();

/** Purges every ISR page and cached read. Called by the engine with `Authorization: Bearer <REVALIDATE_SECRET>`. */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, message: 'REVALIDATE_SECRET not configured' }, { status: 500 });
  }

  const header = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!timingSafeEqual(digest(header), digest(secret))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // The root layout, not per-path calls: revalidatePath('/analysis') misses the dynamic /analysis/[slug] pages.
    revalidatePath('/', 'layout');
    revalidateTag(SITE_DATA_TAG);
  } catch (error) {
    console.warn('Revalidation error:', error);
  }
  return NextResponse.json({ success: true, revalidated: true, at: new Date().toISOString() });
}

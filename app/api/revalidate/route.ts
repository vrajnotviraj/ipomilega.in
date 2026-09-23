import { NextRequest, NextResponse } from 'next/server';
import { revalidateSite } from '@/lib/revalidate';

export const dynamic = 'force-dynamic';

/**
 * Called by the Python jobs after they write to Mongo (scraper, live subscription, analysis
 * generator). Those write straight to the database, so without this ping the site kept
 * serving the pre-scrape pages until ISR expired and a visitor triggered a rebuild.
 *
 * Auth: `Authorization: Bearer <REVALIDATE_SECRET>` or `?secret=<REVALIDATE_SECRET>`.
 */
async function handle(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, message: 'REVALIDATE_SECRET not configured' }, { status: 500 });
  }

  const header = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const query = req.nextUrl.searchParams.get('secret');
  if (header !== secret && query !== secret) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  revalidateSite();
  return NextResponse.json({ success: true, revalidated: true, at: new Date().toISOString() });
}

export const GET = handle;
export const POST = handle;

import 'server-only';
import { cached } from '@/lib/db/cache';
import { getDb } from '@/lib/db/mongo';
import { quotaRows, splitQuota, type QuotaDoc } from '@/lib/ipo/quota';

export type { BuyBeforeIpo, QuotaIpo, QuotaStage } from '@/lib/ipo/quota';

// Only these fields leave the database; where the engine read them stays private.
const PUBLIC_FIELDS = {
  name: 1, stage: 1, source: 1, parents: 1, parent_quotes: 1, drhp_date: 1, open_date: 1, close_date: 1, last_buy_date: 1, listing_date: 1,
  price_band: 1, drhp_url: 1, ipo_slug: 1, issue_size_cr: 1, quota_size_cr: 1, quota_percent: 1,
  announced_on: 1, created_at: 1, announcement_url: 1, checked_at: 1, 'admin.hidden': 1, 'admin.overrides': 1,
};

const LISTED_WINDOW_DAYS = 183; // quota IPOs stay under Recently listed for six months

/** Active docs and the ones listed lately, hidden dropped and overrides applied. */
const getQuotaRows = cached(async () => {
  const db = await getDb();
  const quota = db.collection<QuotaDoc>('shareholder_quota');
  const since = new Date(Date.now() - LISTED_WINDOW_DAYS * 86400000);
  const [docs, listedDocs] = await Promise.all([
    quota.find({ active: true }, { projection: PUBLIC_FIELDS }).toArray(),
    quota.find({ has_quota: true, listing_date: { $gte: since, $lte: new Date() } }, { projection: PUBLIC_FIELDS }).sort({ listing_date: -1 }).toArray(),
  ]);
  return quotaRows(docs, listedDocs);
}, 'shareholder-quota');

/**
 * The page's sections, split per request, not inside the cache. `ipos` (Buy before, approved and filed, without
 * rumours or closed bidding) is what the home and /ipos teasers, summaries, JSON-LD and the planner count.
 */
export async function getShareholderQuotaIpos() {
  return splitQuota(await getQuotaRows());
}

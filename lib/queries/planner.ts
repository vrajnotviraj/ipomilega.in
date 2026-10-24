import 'server-only';
import { createHash } from 'node:crypto';
import { unstable_cache } from 'next/cache';
import { getIpoBuckets } from '@/lib/queries/ipos';
import { getShareholderQuotaIpos } from '@/lib/queries/shareholder-quota';
import { isSkipped, toPlannerIpo, type PlannerIpo, type SkippedIpo } from '@/lib/ipo/planner/ipo';
import type { PlanInputs } from '@/lib/ipo/planner/inputs';
import { DEEP_SEARCH, planIpos, type Plan } from '@/lib/ipo/planner/plan';

const A_DAY = 24 * 60 * 60;

/** Open and upcoming IPOs in planner terms: the ones that can be planned and the ones that can't, with why. */
export async function getPlannerIpos(): Promise<{ ipos: PlannerIpo[]; skipped: SkippedIpo[] }> {
  const [{ live, upcoming }, { ipos: quotaIpos }] = await Promise.all([getIpoBuckets(), getShareholderQuotaIpos()]);
  const items = [...live, ...upcoming].map(({ _id, ipo, analysis }) => {
    const slug = analysis ? analysis.slug || ipo.slug || null : null;
    const parents = quotaIpos.find((quota) => slug && quota.slug === slug)?.parents ?? null;
    return toPlannerIpo(_id, ipo, slug, parents);
  });
  return { ipos: items.filter((item): item is PlannerIpo => !isSkipped(item)), skipped: items.filter(isSkipped) };
}

/**
 * The best plan for the inputs, searched deeply and kept for a day.
 * The cache key hashes the chosen IPOs too, so a new GMP or lot size gets a fresh search and the same facts never repeat one.
 */
export async function getPlan({ ids, funds, accounts, goal, holders }: PlanInputs): Promise<Plan> {
  const { ipos } = await getPlannerIpos();
  const chosen = ipos.filter((ipo) => ids.includes(ipo.id));
  const holdersOfChosen = Object.fromEntries(chosen.map((ipo) => [ipo.id, holders[ipo.id] ?? 0]));

  const key = createHash('sha256').update(JSON.stringify([chosen, funds, accounts, goal, holdersOfChosen])).digest('hex');
  return unstable_cache(async () => planIpos(chosen, funds, accounts, goal, holdersOfChosen, DEEP_SEARCH), ['planner', key], { revalidate: A_DAY })();
}

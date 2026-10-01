import 'server-only';
import { cache } from 'react';
import { getDb, toPlain } from '@/lib/db/mongo';
import { cached } from '@/lib/db/cache';
import { Blog } from '@/types/ipo';

/** Posts readers may see: published or scheduled with a published_at in the past, plus older published posts without one. */
export function liveFilter() {
  const now = new Date().toISOString();
  return { $or: [{ status: 'published', published_at: null }, { status: { $in: ['published', 'scheduled'] }, published_at: { $lte: now } }] };
}

export const NEWEST_FIRST = { published_at: -1, created_at: -1 } as const;

/** Live posts, newest first. Keeps `content`: cards derive read time and the excerpt from it. */
async function findPublishedBlogs(limit = 0): Promise<Blog[]> {
  const db = await getDb();
  const blogs = await db.collection('blogs').find(liveFilter()).sort(NEWEST_FIRST).limit(limit).toArray();
  return toPlain(blogs) as unknown as Blog[];
}

/** The three newest live posts, for the homepage. */
export const getFeaturedBlogs = cache(cached(() => findPublishedBlogs(3), 'getFeaturedBlogs'));

export const getPublishedBlogs = cache(cached(() => findPublishedBlogs(), 'getPublishedBlogs'));

/** One live post by slug, or null for a draft, a post scheduled for later, or an unknown slug. */
export const getBlogBySlug = cache(cached(async (slug: string): Promise<Blog | null> => {
  const db = await getDb();
  const blog = await db.collection('blogs').findOne({ slug, ...liveFilter() });
  return blog ? (toPlain(blog) as unknown as Blog) : null;
}, 'getBlogBySlug'));

/** Published posts about one IPO, oldest first. ponytail: filters the cached full list; query by ipo_id once posts number in the thousands. */
export async function getIpoArticles(ipoId: string): Promise<Blog[]> {
  const blogs = await getPublishedBlogs();
  return blogs.filter((blog) => blog.ipo_id === ipoId).reverse();
}

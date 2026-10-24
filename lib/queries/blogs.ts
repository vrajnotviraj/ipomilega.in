import 'server-only';
import { cache } from 'react';
import { getDb, toPlain } from '@/lib/db/mongo';
import { cached } from '@/lib/db/cache';
import { Blog } from '@/types/ipo';
import { localize, type Locale } from '@/lib/i18n/locales';
import { getTranslation, getTranslationMap } from '@/lib/queries/translations';

/** Posts readers may see: published or scheduled with a published_at in the past, plus older published posts without one. */
export function liveFilter() {
  const now = new Date().toISOString();
  return { $or: [{ status: 'published', published_at: null }, { status: { $in: ['published', 'scheduled'] }, published_at: { $lte: now } }] };
}

export const NEWEST_FIRST = { published_at: -1, created_at: -1 } as const;

/** Live posts, newest first, with titles and excerpts in `lang` where translated. Keeps `content`: cards derive read time and the excerpt from it. */
async function findPublishedBlogs(lang: Locale, limit = 0): Promise<Blog[]> {
  const db = await getDb();
  const [blogs, translations] = await Promise.all([
    db.collection('blogs').find(liveFilter()).sort(NEWEST_FIRST).limit(limit).toArray(),
    getTranslationMap('blog', lang),
  ]);
  return (toPlain(blogs) as unknown as Blog[]).map((blog) => localize(blog, translations[blog._id]));
}

/** The three newest live posts, for the homepage. */
export const getFeaturedBlogs = cache(cached((lang: Locale) => findPublishedBlogs(lang, 3), 'getFeaturedBlogs'));

export const getPublishedBlogs = cache(cached((lang: Locale) => findPublishedBlogs(lang), 'getPublishedBlogs'));

/** One live post by slug in `lang` (English until translated), or null for a draft, a post scheduled for later, or an unknown slug. */
export const getBlogBySlug = cache(cached(async (slug: string, lang: Locale): Promise<Blog | null> => {
  const db = await getDb();
  const doc = await db.collection('blogs').findOne({ slug, ...liveFilter() });
  if (!doc) return null;
  const blog = toPlain(doc) as unknown as Blog;
  return localize(blog, await getTranslation('blog', blog._id, lang));
}, 'getBlogBySlug'));

/** Published posts about one IPO, oldest first. ponytail: filters the cached full list; query by ipo_id once posts number in the thousands. */
export async function getIpoArticles(ipoId: string, lang: Locale): Promise<Blog[]> {
  const blogs = await getPublishedBlogs(lang);
  return blogs.filter((blog) => blog.ipo_id === ipoId).reverse();
}

import 'server-only';
import { cache } from 'react';
import { getDb } from '@/lib/mongo';
import { cached } from '@/lib/cache';
import { Blog } from '@/types/ipo';

// List queries keep `content`: the cards derive read time and the excerpt fallback from it.

const toPlain = <T>(doc: T): T => JSON.parse(JSON.stringify(doc));

async function findBlogs(filter: object, limit = 0): Promise<Blog[]> {
  const db = await getDb();
  const blogs = await db.collection('blogs').find(filter).sort({ created_at: -1 }).limit(limit).toArray();
  return toPlain(blogs) as unknown as Blog[];
}

/** The three newest published posts, for the homepage. */
export const getFeaturedBlogs = cache(cached(() => findBlogs({ status: 'published' }, 3), 'getFeaturedBlogs'));

export const getPublishedBlogs = cache(cached(() => findBlogs({ status: 'published' }), 'getPublishedBlogs'));

export const getBlogBySlug = cache(cached(async (slug: string): Promise<Blog | null> => {
  const db = await getDb();
  const blog = await db.collection('blogs').findOne({ slug });
  if (!blog || blog.status !== 'published') return null;
  return toPlain(blog) as unknown as Blog;
}, 'getBlogBySlug'));

export const getBlogCategories = cache(cached(async () => {
  const db = await getDb();
  const docs = await db
    .collection('categories')
    .find({
      status: 'published',
      category: { $in: ['IPO Analysis', 'Company Review', 'Market News', 'Investment Guide'] },
    })
    .toArray();

  const byCategory = (name: string) => toPlain(docs.filter((d) => d.category === name));

  return {
    ipo_analysis: byCategory('IPO Analysis'),
    company_review: byCategory('Company Review'),
    market_news: byCategory('Market News'),
    investment_guide: byCategory('Investment Guide'),
  };
}, 'getBlogCategories'));

/** Every blog, drafts included, for admin. */
export const getAllBlogs = cache(() => findBlogs({}));

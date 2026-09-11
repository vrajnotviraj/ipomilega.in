import 'server-only';
import { cache } from 'react';
import { getDb } from '@/lib/mongo';
import { Blog } from '@/app/models/ipo';

// NOTE: `content` is deliberately *not* projected away on list queries. The cards derive both
// the "N min read" estimate and the excerpt fallback from the body text, so dropping it would
// change what renders. The collection is empty today, so there is no measured payload win to
// trade that correctness against.

function toPlain<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

/**
 * The three newest published posts for the homepage.
 * Sorting and slicing now happen in Mongo; the old version pulled the whole collection
 * into Node, sorted it in JS and threw away everything past index 2.
 */
export const getFeaturedBlogs = cache(async (): Promise<Blog[]> => {
  const db = await getDb();
  const blogs = await db
    .collection('blogs')
    .find({ status: 'published' })
    .sort({ created_at: -1 })
    .limit(3)
    .toArray();
  return toPlain(blogs) as unknown as Blog[];
});

/** All published posts for the /blogs index. */
export const getPublishedBlogs = cache(async (): Promise<Blog[]> => {
  const db = await getDb();
  const blogs = await db
    .collection('blogs')
    .find({ status: 'published' })
    .sort({ created_at: -1 })
    .toArray();
  return toPlain(blogs) as unknown as Blog[];
});

/** A single published post by slug, content included. */
export const getBlogBySlug = cache(async (slug: string): Promise<Blog | null> => {
  const db = await getDb();
  const blog = await db.collection('blogs').findOne({ slug });
  if (!blog || blog.status !== 'published') return null;
  return toPlain(blog) as unknown as Blog;
});

export const getBlogCategories = cache(async () => {
  const db = await getDb();
  // One grouped read replaces four near-identical find() calls that ran back to back.
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
});

/** Every blog, published or draft -- admin only. */
export const getAllBlogs = cache(async (): Promise<Blog[]> => {
  const db = await getDb();
  const blogs = await db
    .collection('blogs')
    .find({})
    .sort({ created_at: -1 })
    .toArray();
  return toPlain(blogs) as unknown as Blog[];
});

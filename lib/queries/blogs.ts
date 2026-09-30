import 'server-only';
import { cache } from 'react';
import { getDb, toPlain } from '@/lib/db/mongo';
import { cached } from '@/lib/db/cache';
import { Blog } from '@/types/ipo';

/** Published posts, newest first. Keeps `content`: cards derive read time and the excerpt from it. */
async function findPublishedBlogs(limit = 0): Promise<Blog[]> {
  const db = await getDb();
  const blogs = await db.collection('blogs').find({ status: 'published' }).sort({ created_at: -1 }).limit(limit).toArray();
  return toPlain(blogs) as unknown as Blog[];
}

/** The three newest published posts, for the homepage. */
export const getFeaturedBlogs = cache(cached(() => findPublishedBlogs(3), 'getFeaturedBlogs'));

export const getPublishedBlogs = cache(cached(() => findPublishedBlogs(), 'getPublishedBlogs'));

/** One published post by slug, or null for a draft or unknown slug. */
export const getBlogBySlug = cache(cached(async (slug: string): Promise<Blog | null> => {
  const db = await getDb();
  const blog = await db.collection('blogs').findOne({ slug });
  if (!blog || blog.status !== 'published') return null;
  return toPlain(blog) as unknown as Blog;
}, 'getBlogBySlug'));

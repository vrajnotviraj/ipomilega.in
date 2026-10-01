import 'server-only';
import { cache } from 'react';
import { getDb, toPlain } from '@/lib/db/mongo';
import { cached } from '@/lib/db/cache';
import { liveFilter, NEWEST_FIRST } from '@/lib/queries/blogs';
import { toSummary, type PostSummary } from '@/components/blog/blog-format';
import { Author, Blog } from '@/types/ipo';

export const AUTHOR_PAGE_SIZE = 12;

/** One writer by slug, or null. */
export const getAuthor = cache(cached(async (slug: string): Promise<Author | null> => {
  const db = await getDb();
  const author = await db.collection('authors').findOne({ slug }, { projection: { _id: 0, slug: 1, name: 1, bio: 1 } });
  return author as Author | null;
}, 'getAuthor'));

/** Every writer, for the sitemap. */
export const getAuthors = cache(cached(async (): Promise<Author[]> => {
  const db = await getDb();
  return (await db.collection('authors').find({}, { projection: { _id: 0, slug: 1, name: 1 } }).toArray()) as unknown as Author[];
}, 'getAuthors'));

/** One page of a writer's live posts as card summaries, newest first, with their total. */
export const getAuthorPosts = cache(cached(async (slug: string, page: number): Promise<{ posts: PostSummary[]; total: number }> => {
  const db = await getDb();
  const filter = { author_slug: slug, ...liveFilter() };
  const [total, blogs] = await Promise.all([
    db.collection('blogs').countDocuments(filter),
    db.collection('blogs').find(filter).sort(NEWEST_FIRST).skip((page - 1) * AUTHOR_PAGE_SIZE).limit(AUTHOR_PAGE_SIZE).toArray(),
  ]);
  return { posts: (toPlain(blogs) as unknown as Blog[]).map(toSummary), total };
}, 'getAuthorPosts'));

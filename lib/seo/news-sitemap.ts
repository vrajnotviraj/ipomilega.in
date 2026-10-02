import type { Blog } from '@/types/ipo';

const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

const escapeXml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** When the article first went live; older blogs have no published_at, so they fall back to created_at. */
export const publishedAtOf = (blog: Blog) => blog.published_at ?? blog.created_at;

/** When the article last changed, never before it went live: a post saved the night before it publishes has updated_at earlier than published_at. */
export const modifiedAtOf = (blog: Blog) => {
  const published = publishedAtOf(blog);
  const updated = blog.updated_at || blog.created_at;
  return new Date(updated) > new Date(published) ? updated : published;
};

/** True for a news article first published in the 48 hours before `now`. */
export const isFreshNews = (blog: Blog, now: number) =>
  Boolean(blog.article_type) && blog.article_type !== 'analysis' && now - new Date(publishedAtOf(blog)).getTime() <= TWO_DAYS_MS;

/** One Google News <url> entry. */
export const newsEntry = (blog: Blog, siteUrl: string, siteName: string) => `<url>
<loc>${siteUrl}/blogs/${escapeXml(blog.slug)}</loc>
<news:news>
<news:publication><news:name>${siteName}</news:name><news:language>en</news:language></news:publication>
<news:publication_date>${new Date(publishedAtOf(blog)).toISOString()}</news:publication_date>
<news:title>${escapeXml(blog.title)}</news:title>
</news:news>
</url>`;

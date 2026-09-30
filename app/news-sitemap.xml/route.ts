import { getPublishedBlogs } from '@/lib/queries/blogs';
import { SITE_NAME, SITE_URL } from '@/lib/seo/share';
import type { Blog } from '@/types/ipo';

export const revalidate = 600;

const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

/** True for a news article first published in the last 48 hours. */
const isFreshNews = (blog: Blog) => blog.article_type && blog.article_type !== 'analysis' && Date.now() - new Date(blog.created_at).getTime() <= TWO_DAYS_MS;

/** One Google News <url> entry. */
const newsEntry = (blog: Blog) => `<url>
<loc>${SITE_URL}/blogs/${blog.slug}</loc>
<news:news>
<news:publication><news:name>${SITE_NAME}</news:name><news:language>en</news:language></news:publication>
<news:publication_date>${new Date(blog.created_at).toISOString()}</news:publication_date>
<news:title>${blog.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</news:title>
</news:news>
</url>`;

/** Google News sitemap: engine news articles (subscription, allotment, listing) published in the last 48 hours. */
export async function GET() {
  const blogs = (await getPublishedBlogs()).filter(isFreshNews);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${blogs.map(newsEntry).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

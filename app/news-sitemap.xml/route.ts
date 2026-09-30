import { getPublishedBlogs } from '@/lib/queries/blogs';
import { SITE_NAME, SITE_URL } from '@/lib/seo/share';
import { isFreshNews, newsEntry } from '@/lib/seo/news-sitemap';

export const revalidate = 600;

/** Google News sitemap: engine news articles (subscription, allotment, listing) published in the last 48 hours. */
export async function GET() {
  const now = Date.now();
  const blogs = (await getPublishedBlogs()).filter((blog) => isFreshNews(blog, now));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${blogs.map((blog) => newsEntry(blog, SITE_URL, SITE_NAME)).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

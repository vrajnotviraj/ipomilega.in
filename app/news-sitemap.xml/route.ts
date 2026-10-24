import { getPublishedBlogs } from '@/lib/queries/blogs';
import { getTranslatedKeys } from '@/lib/queries/translations';
import { SITE_NAME, SITE_URL } from '@/lib/seo/share';
import { isFreshNews, newsEntry } from '@/lib/seo/news-sitemap';
import { LOCALES } from '@/lib/i18n/locales';

export const revalidate = 600;

/** Google News sitemap: engine news articles (subscription, allotment, listing) published in the last 48 hours, in each language they are translated into. */
export async function GET() {
  const now = Date.now();
  const [keys, ...blogsByLang] = await Promise.all([getTranslatedKeys(), ...LOCALES.map((lang) => getPublishedBlogs(lang))]);
  const translated = new Set(keys);
  const entries = LOCALES.flatMap((lang, i) =>
    blogsByLang[i]
      .filter((blog) => isFreshNews(blog, now) && (lang === 'en' || translated.has(`blog|${blog._id}|${lang}`)))
      .map((blog) => newsEntry(blog, SITE_URL, SITE_NAME, lang))
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries.join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

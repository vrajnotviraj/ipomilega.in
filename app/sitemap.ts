import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/share';
import { getAnalysisSlugs } from '@/lib/queries/ipos';
import { getShareholderQuotaIpos } from '@/lib/queries/shareholder-quota';
import { getPublishedBlogs } from '@/lib/queries/blogs';
import { getAuthors } from '@/lib/queries/authors';
import { getTranslatedKeys, type TranslationKind } from '@/lib/queries/translations';
import { modifiedAtOf } from '@/lib/seo/news-sitemap';
import { languageAlternates, type Locale, localePath, LOCALES } from '@/lib/i18n/locales';

// Rendered per request from the cached reads, so the build needs no database.
export const dynamic = 'force-dynamic';

type Entry = Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>;

/** One <url> per language the page exists in, each listing every language as an alternate. */
const entries = (path: string, locales: readonly Locale[], extra: Entry): MetadataRoute.Sitemap =>
  locales.map((locale) => ({ url: `${SITE_URL}${localePath(locale, path)}`, alternates: { languages: languageAlternates(path, SITE_URL, locales) }, ...extra }));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [analyses, blogs, authors, quota, keys] = await Promise.all([
    getAnalysisSlugs(),
    getPublishedBlogs('en'),
    getAuthors(),
    getShareholderQuotaIpos(),
    getTranslatedKeys(),
  ]);
  const translated = new Set(keys);
  const localesOf = (kind: TranslationKind, id: string): Locale[] => LOCALES.filter((lang) => lang === 'en' || translated.has(`${kind}|${id}|${lang}`));
  const authorsWithPosts = new Set(blogs.map((blog) => blog.author_slug));

  return [
    ...entries('/', LOCALES, { changeFrequency: 'hourly', priority: 1 }),
    ...entries('/ipos', LOCALES, { changeFrequency: 'hourly', priority: 0.9 }),
    ...entries('/ipos/planner', LOCALES, { changeFrequency: 'daily', priority: 0.7 }),
    ...entries('/ipos/shareholder-quota', LOCALES, { lastModified: quota.checkedAt ?? undefined, changeFrequency: 'daily', priority: 0.7 }),
    ...entries('/blogs', LOCALES, { changeFrequency: 'weekly', priority: 0.5 }),
    ...entries('/about', LOCALES, { changeFrequency: 'monthly', priority: 0.3 }),
    ...analyses.flatMap(({ _id, slug, updated_at }) =>
      entries(`/analysis/${slug}`, localesOf('analysis', _id), { lastModified: updated_at, changeFrequency: 'daily', priority: 0.8 })
    ),
    ...blogs.flatMap((blog) => entries(`/blogs/${blog.slug}`, localesOf('blog', blog._id), { lastModified: modifiedAtOf(blog), changeFrequency: 'monthly', priority: 0.5 })),
    // Only writers with a live post; an empty profile is noindex.
    ...authors
      .filter((author) => authorsWithPosts.has(author.slug))
      .flatMap((author) => entries(`/authors/${author.slug}`, LOCALES, { changeFrequency: 'weekly', priority: 0.3 })),
  ];
}

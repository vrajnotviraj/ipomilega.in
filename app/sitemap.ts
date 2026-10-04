import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/share';
import { getAnalysisSlugs } from '@/lib/queries/ipos';
import { getShareholderQuotaIpos } from '@/lib/queries/shareholder-quota';
import { getPublishedBlogs } from '@/lib/queries/blogs';
import { getAuthors } from '@/lib/queries/authors';
import { modifiedAtOf } from '@/lib/seo/news-sitemap';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [analyses, blogs, authors, quota] = await Promise.all([getAnalysisSlugs(), getPublishedBlogs(), getAuthors(), getShareholderQuotaIpos()]);
  const authorsWithPosts = new Set(blogs.map((blog) => blog.author_slug));

  return [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/ipos`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/ipos/shareholder-quota`, lastModified: quota.checkedAt ?? undefined, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/blogs`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
    ...analyses.map(({ slug, updated_at }) => ({
      url: `${SITE_URL}/analysis/${slug}`,
      lastModified: updated_at,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...blogs.map((blog) => ({
      url: `${SITE_URL}/blogs/${blog.slug}`,
      lastModified: modifiedAtOf(blog),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    // Only writers with a live post; an empty profile is noindex.
    ...authors.filter((author) => authorsWithPosts.has(author.slug)).map((author) => ({
      url: `${SITE_URL}/authors/${author.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.3,
    })),
  ];
}

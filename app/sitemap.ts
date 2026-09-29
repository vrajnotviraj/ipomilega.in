import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/share';
import { getAnalysisSlugs } from '@/lib/queries/ipos';
import { getPublishedBlogs } from '@/lib/queries/blogs';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [analyses, blogs] = await Promise.all([getAnalysisSlugs(), getPublishedBlogs()]);

  return [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/ipos`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/analysis`, changeFrequency: 'daily', priority: 0.8 },
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
      lastModified: blog.updated_at || blog.created_at,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}

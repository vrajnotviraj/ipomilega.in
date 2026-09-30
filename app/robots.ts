import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/share';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/revalidate', '/api/subscription', '/ingest/'],
    },
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
  };
}

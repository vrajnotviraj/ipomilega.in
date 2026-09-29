import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/share';

// Everything public is crawlable, AI answer engines included; admin, auth and blog-editor
// screens are not content. /api stays open: the /analysis index renders its list from
// /api/analysis in the browser, and Googlebot can't render what robots blocks it from fetching.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/unauthorized', '/blogs/edit-a-blog/', '/blogs/*/create-a-blog'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

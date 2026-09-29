import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/share';

// /api stays crawlable: the /analysis index fetches its list from /api/analysis in the browser.
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

import 'server-only';
import { HomePageData } from '@/types/homepage';
import { getIpoBuckets } from '@/lib/queries/ipos';
import { getFeaturedBlogs } from '@/lib/queries/blogs';

// Reads the home page's IPO buckets and featured blogs straight from the database, in parallel.
export async function getHomePageData(): Promise<HomePageData> {
  try {
    const [{ upcoming, live, closed, past }, blogList] = await Promise.all([getIpoBuckets(), getFeaturedBlogs()]);
    return {
      data: { upcoming, live, closed, past },
      counts: { upcoming: upcoming.length, live: live.length, closed: closed.length, past: past.length },
      blogList,
    };
  } catch (error) {
    // Rethrow, never return empty buckets: ISR would cache the empty page for the whole
    // revalidate window, while a throw keeps the last good page.
    console.error('Error fetching homepage data:', error);
    throw error;
  }
}

import 'server-only';
import { HomePageData } from '@/app/types/homepage';
import { getIpoBuckets } from '@/lib/queries/ipos';
import { getFeaturedBlogs } from '@/lib/queries/blogs';

/**
 * Homepage data.
 *
 * This used to `fetch()` the app's own /api/ipo and /api/blogs/featured routes over HTTP.
 * That meant every render paid for a second HTTP round-trip into the same server, a second
 * pass through Next's router, and a JSON serialise/parse of the entire payload -- all before
 * a single byte reached the browser. It also silently broke wherever NEXTAUTH_URL wasn't set
 * (the fallback pointed at localhost:3000) and made the page impossible to prerender, since
 * the server has to already be listening to fetch itself.
 *
 * Now it calls the database directly and the two reads run concurrently.
 */
export async function getHomePageData(): Promise<HomePageData> {
  try {
    const [buckets, blogList] = await Promise.all([getIpoBuckets(), getFeaturedBlogs()]);

    return {
      data: {
        upcoming: buckets.upcoming,
        live: buckets.live,
        closed: buckets.closed,
        past: buckets.past,
      },
      counts: {
        upcoming: buckets.upcoming.length,
        live: buckets.live.length,
        closed: buckets.closed.length,
        past: buckets.past.length,
      },
      blogList,
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return {
      data: { upcoming: [], live: [], closed: [], past: [] },
      counts: { upcoming: 0, live: 0, closed: 0, past: 0 },
      blogList: [],
    };
  }
}

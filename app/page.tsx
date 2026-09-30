import { BlogSection } from '@/components/home/BlogSection';
import { LiveIposSection } from '@/components/home/LiveIposSection';
import { ClosedIposSection } from '@/components/home/ClosedIposSection';
import { IpoTicker } from '@/components/home/IpoTicker';
import { PastIposSection } from '@/components/home/PastIposSection';
import { UpcomingIposSection } from '@/components/home/UpcomingIpos';
import { ScoreMethodology } from '@/components/home/ScoreMethodology';
import { getIpoBuckets } from '@/lib/queries/ipos';
import { getFeaturedBlogs } from '@/lib/queries/blogs';
import { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Walkthrough } from '@/components/home/Walkthrough';
import { Hero } from '@/components/home/Hero';
import { BoardProvider } from '@/components/home/BoardContext';
import { openGraphBase } from '@/lib/seo/share';

// Served from the ISR cache; /api/revalidate purges it sooner.
export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    absolute: 'IPO Milega | Live, upcoming and past Indian IPOs, scored',
  },
  description: 'Track live, upcoming and past Indian IPOs. Every prospectus gets a scored breakdown, next to GMP, subscription and your allotment odds.',
  keywords: [
    'IPO',
    'Initial Public Offering',
    'IPO investments',
    'upcoming IPO',
    'live IPO',
    'stock market',
    'IPO listing',
    'investment opportunities',
    'IPO Milega',
    'India IPO'
  ],
  openGraph: {
    ...openGraphBase(),
    url: '/',
    title: 'IPO Milega | Every Indian IPO, scored',
    description: 'Track live, upcoming and past Indian IPOs, with a scored breakdown of every prospectus.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPO Milega | Every Indian IPO, scored',
    description: 'Track live, upcoming and past Indian IPOs, with a scored breakdown of every prospectus.',
    creator: '@ipomilega',
  },
  alternates: {
    canonical: '/',
  },
};

// Awaited without a <Suspense> boundary: under ISR the data is ready at build time, and a
// boundary would ship a spinner that delays LCP.
export default async function HomePage() {
  const [{ upcoming, live, closed, past }, blogs] = await Promise.all([getIpoBuckets(), getFeaturedBlogs()]);

  return (
    <div className="min-h-screen">
      <div className="app-container pt-16">
        <Hero openCount={live.length} upcomingCount={upcoming.length} />
      </div>
      <IpoTicker live={live} upcoming={upcoming} />
      <div className="app-container">
        <BoardProvider>
          <LiveIposSection ipos={live} />
          <div className="reveal">
            <ClosedIposSection ipos={closed} />
          </div>
          <div className="reveal">
            <UpcomingIposSection ipos={upcoming} />
          </div>
        </BoardProvider>
        <div className="reveal">
          <PastIposSection ipos={past} />
        </div>
        <div className="reveal">
          <ScoreMethodology />
        </div>
        <div className="reveal">
          <BlogSection blogs={blogs} />
        </div>
        <Footer />
      </div>
      <Walkthrough />
    </div>
  );
}

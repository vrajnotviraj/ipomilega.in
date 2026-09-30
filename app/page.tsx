import { BlogSection } from '@/components/home/BlogSection';
import { LiveIposSection } from '@/components/home/LiveIposSection';
import { ClosedIposSection } from '@/components/home/ClosedIposSection';
import { IpoTicker } from '@/components/home/IpoTicker';
import { PastIposSection } from '@/components/home/PastIposSection';
import { UpcomingIposSection } from '@/components/home/UpcomingIpos';
import { ScoreMethodology } from '@/components/home/ScoreMethodology';
import { AnnouncementBanner } from '@/components/home/AnnouncementBanner';
import { getHomePageData } from '@/lib/data-fetching';
import { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Walkthrough } from '@/components/home/Walkthrough';
import { BoardProvider } from '@/components/home/BoardContext';
import { openGraphBase, SITE_NAME, SITE_URL } from '@/lib/share';

// Served from the ISR cache; /api/revalidate purges it sooner.
export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    absolute: 'IPO Milega | Live, Upcoming & Past Indian IPOs, Scored',
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
  authors: [{ name: 'IPO Milega Team' }],
  creator: 'IPO Milega',
  publisher: 'IPO Milega',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    ...openGraphBase(),
    url: '/',
    title: 'IPO Milega | Every Indian IPO, Scored',
    description: 'Track live, upcoming and past Indian IPOs, with a scored breakdown of every prospectus.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPO Milega | Every Indian IPO, Scored',
    description: 'Track live, upcoming and past Indian IPOs, with a scored breakdown of every prospectus.',
    creator: '@ipomilega',
  },
  alternates: {
    canonical: '/',
  },
};

// Who publishes the site and what it is, for search and answer engines.
const SITE_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/apple-icon.png`,
      sameAs: ['https://x.com/ipomilega'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: 'Live, upcoming and past Indian IPOs with GMP, subscription, allotment dates and a scored analysis of every prospectus.',
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-IN',
    },
  ],
};

// Awaited without a <Suspense> boundary: under ISR the data is ready at build time, and a
// boundary would ship a spinner that delays LCP.
export default async function HomePage() {
  const { data, counts, blogList } = await getHomePageData();

  return (
    <div className="min-h-screen relative overflow-hidden paper-texture">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_STRUCTURED_DATA) }} />
      <div className="relative z-10">
        <div className="app-container pt-20 sm:pt-24">
          <IpoTicker live={data.live} upcoming={data.upcoming} />
          <AnnouncementBanner />
          <BoardProvider>
            <LiveIposSection ipos={data.live} count={counts.live} />
            <div className="reveal">
              <ClosedIposSection ipos={data.closed} count={counts.closed} />
            </div>
            <div className="reveal">
              <UpcomingIposSection ipos={data.upcoming} count={counts.upcoming} />
            </div>
          </BoardProvider>
          <div className="reveal">
            <PastIposSection ipos={data.past} />
          </div>
          <div className="reveal">
            <ScoreMethodology />
          </div>
          <div className="reveal">
            <BlogSection blogs={blogList} />
          </div>
          <Footer />
        </div>
        <Walkthrough />
      </div>
    </div>
  );
}

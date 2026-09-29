import { BlogSection } from '@/components/Home/BlogSection';
import { LiveIposSection } from '@/components/Home/LiveIposSection';
import { ClosedIposSection } from '@/components/Home/ClosedIposSection';
import { IpoTicker } from '@/components/Home/IpoTicker';
import { PastIposSection } from '@/components/Home/PastIposSection';
import { UpcomingIposSection } from '@/components/Home/UpcomingIpos';
import { ScoreMethodology } from '@/components/Home/ScoreMethodology';
import { AnnouncementBanner } from '@/components/Home/AnnouncementBanner';
import { getHomePageData } from '@/lib/data-fetching';
import { Metadata } from 'next';
import { HomePageData } from './types/homepage';
import { Footer } from '@/components/Home/Footer';
import { Walkthrough } from '@/components/Home/Walkthrough';
import { AnimatedSection } from '@/components/Home/AnimatedSection';
import { BoardProvider } from '@/components/Home/BoardContext';
import { openGraphBase, SITE_NAME, SITE_URL } from '@/lib/share';

// ISR: the page is rendered once and served from cache as static HTML, then re-rendered in
// the background at most once a minute. Visitors never wait on Mongo. Writes (admin edits,
// the scraper via /api/revalidate) purge it immediately; this window is only the fallback,
// and at 5 minutes it was long enough for a stale copy to survive several refreshes.
// `generateStaticParams` used to be exported here, but it is only meaningful on a dynamic
// [param] route -- on a static route Next ignores it, so it bought nothing.
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
    // Image comes from app/opengraph-image.tsx (the brand mark), not a hardcoded file.
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

// Who publishes the site, and what it is -- the entity answer engines cite. Home page only.
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

// Awaited here rather than behind a <Suspense> skeleton: the page is ISR, so the data is always
// ready by the time the HTML is built, and a boundary only made that HTML ship a spinner with
// the real content in a hidden div swapped in by script -- LCP waited on that script.
export default async function HomePage() {
  const homeData = await getHomePageData();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_STRUCTURED_DATA) }} />
      <div className="relative z-10">
        <HomeContent homeData={homeData} />
      </div>
    </div>
  );
}

function HomeContent({ homeData }: { homeData: HomePageData }) {
  return (
    <>
      <div className="app-container pt-20 sm:pt-24">
        <IpoTicker live={homeData.data.live} upcoming={homeData.data.upcoming} />
        <AnnouncementBanner />
        <BoardProvider>
        <LiveIposSection ipos={homeData.data.live} count={homeData.counts.live} />
        <AnimatedSection>
          <ClosedIposSection ipos={homeData.data.closed} count={homeData.counts.closed} />
        </AnimatedSection>
        <AnimatedSection>
          <UpcomingIposSection ipos={homeData.data.upcoming} count={homeData.counts.upcoming} />
        </AnimatedSection>
        </BoardProvider>
        <AnimatedSection>
          <PastIposSection ipos={homeData.data.past} count={homeData.counts.past} />
        </AnimatedSection>
        <AnimatedSection>
          <ScoreMethodology />
        </AnimatedSection>
        <AnimatedSection>
          <BlogSection blogs={homeData.blogList} />
        </AnimatedSection>
        <Footer />
      </div>
      <Walkthrough />
    </>
  );
}

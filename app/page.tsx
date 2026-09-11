import { Suspense } from 'react';

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
import { AnimatedWrapper } from '@/components/Home/AnimatedWrapper';
import { AnimatedSection } from '@/components/Home/AnimatedSection';
import { PageLoader } from '@/components/ui/loader';

// ISR: the page is rendered once and served from the edge cache as static HTML, then
// re-rendered in the background at most every 5 minutes. Visitors never wait on Mongo.
// `generateStaticParams` used to be exported here, but it is only meaningful on a dynamic
// [param] route -- on a static route Next ignores it, so it bought nothing.
export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: 'IPO Milega - Your Gateway to IPO Investments | Live, Upcoming & Past IPOs',
  },
  description: 'Discover the latest IPO opportunities with IPO Milega. Track live IPOs, upcoming listings, and past performance. Get expert insights and make informed investment decisions.',
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
    type: 'website',
    locale: 'en_US',
    url: 'https://ipomilega.com',
    title: 'IPO Milega - Your Gateway to IPO Investments',
    description: 'Discover the latest IPO opportunities with IPO Milega. Track live IPOs, upcoming listings, and past performance.',
    siteName: 'IPO Milega',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IPO Milega - IPO Investment Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPO Milega - Your Gateway to IPO Investments',
    description: 'Discover the latest IPO opportunities. Track live IPOs, upcoming listings, and past performance.',
    images: ['/twitter-image.png'],
    creator: '@ipomilega',
  },
  alternates: {
    canonical: 'https://ipomilega.com',
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default async function HomePage() {
  const homeDataPromise = getHomePageData();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10">
        <Suspense fallback={<HomePageSkeleton />}>
          <HomeContent dataPromise={homeDataPromise} />
        </Suspense>
      </div>
    </div>
  );
}

// Server Component - fetches data
// Remove the space-y-20 and just use app-container
async function HomeContent({ dataPromise }: { dataPromise: Promise<HomePageData> }) {
  const homeData = await dataPromise;

  return (
    <AnimatedWrapper>
      <div className="app-container pt-20 sm:pt-24">
        <IpoTicker live={homeData.data.live} upcoming={homeData.data.upcoming} />
        <AnnouncementBanner />
        <LiveIposSection ipos={homeData.data.live} count={homeData.counts.live} />
        <AnimatedSection>
          <ClosedIposSection ipos={homeData.data.closed} count={homeData.counts.closed} />
        </AnimatedSection>
        <AnimatedSection>
          <UpcomingIposSection ipos={homeData.data.upcoming} count={homeData.counts.upcoming} />
        </AnimatedSection>
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
    </AnimatedWrapper>
  );
}

function HomePageSkeleton() {
  return (
    <div className="app-container pt-24 pb-16">
      <PageLoader label="Loading IPOs" />
    </div>
  );
}

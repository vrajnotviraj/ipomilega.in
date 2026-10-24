import { BlogSection } from '@/components/home/BlogSection';
import { LiveIposSection } from '@/components/home/LiveIposSection';
import { ClosedIposSection } from '@/components/home/ClosedIposSection';
import { IpoTicker } from '@/components/home/IpoTicker';
import { PastIposSection } from '@/components/home/PastIposSection';
import { UpcomingIposSection } from '@/components/home/UpcomingIpos';
import { ScoreMethodology } from '@/components/home/ScoreMethodology';
import { getIpoBuckets } from '@/lib/queries/ipos';
import { QuotaTeaser } from '@/components/shareholder-quota/QuotaTeaser';
import { getShareholderQuotaIpos } from '@/lib/queries/shareholder-quota';
import { getFeaturedBlogs } from '@/lib/queries/blogs';
import { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { BoardProvider } from '@/components/home/BoardContext';
import { alternatesFor, openGraphBase } from '@/lib/seo/share';
import { setLocale, t } from '@/lib/i18n/server';
import { localePath } from '@/lib/i18n/locales';

// Served from the ISR cache; /api/revalidate purges it sooner.
export const revalidate = 60;

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const lang = setLocale((await params).lang);
  const d = t().home.meta;
  return {
  title: {
    absolute: d.title,
  },
  description: d.description,
  openGraph: {
    ...openGraphBase(lang),
    url: localePath(lang, '/'),
    title: d.ogTitle,
    description: d.ogDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: d.ogTitle,
    description: d.ogDescription,
    creator: '@ipomilega',
  },
  alternates: alternatesFor(lang, '/'),
  };
}

// Awaited without a <Suspense> boundary: under ISR the data is ready at build time, and a
// boundary would ship a spinner that delays LCP.
export default async function HomePage({ params }: Params) {
  const lang = setLocale((await params).lang);
  const [{ upcoming, live, closed, past }, blogs, { ipos: quota }] = await Promise.all([getIpoBuckets(), getFeaturedBlogs(lang), getShareholderQuotaIpos()]);

  return (
    <div className="min-h-screen">
      <div className="app-container pt-16">
        <Hero />
      </div>
      <IpoTicker live={live} upcoming={upcoming} />
      <div className="app-container">
        <BoardProvider>
          <LiveIposSection ipos={live} upcoming={upcoming} closed={closed} />
          <ClosedIposSection ipos={closed} />
          <div className="py-2">
            <QuotaTeaser count={quota.length} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-10">
            <div className="reveal min-w-0">
              <UpcomingIposSection ipos={upcoming} quota={quota} />
            </div>
            <div className="reveal min-w-0">
              <PastIposSection ipos={past} />
            </div>
          </div>
        </BoardProvider>
        <div className="reveal">
          <ScoreMethodology />
        </div>
        <BlogSection blogs={blogs} />
      </div>
    </div>
  );
}

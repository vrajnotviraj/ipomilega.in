import { Metadata } from 'next'
import AnalysisPageClient from './AnalysisPageClient'
import { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis"
import { Ipo } from '@/types/ipo';
import { getAnalysisBySlug, getAnalysisSlugs } from '@/lib/queries/ipos';
import { buildShareDescription, closingLine, gmpLine, formatDay, overallScoreOf, openGraphBase, SITE_NAME, SITE_URL } from '@/lib/share';
import { ArrowLeftCircle, Clock, FileSearch } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export const revalidate = 60
// Slugs published after the build still render on first request, then get cached.
export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const analyses = await getAnalysisSlugs()
    return analyses.map(({ slug }) => ({ id: slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const data = await getAnalysisBySlug(id)
  const analysis = data?.ipos_analysis
  const ipo = data?.ipo

  if (!analysis) {
    return {
      title: 'IPO Analysis Not Found',
      description: 'The requested IPO analysis could not be found.',
    }
  }

  const gmp = gmpLine(analysis.gmp_price_gain ?? ipo?.gmp_price_gain)
  const deadline = closingLine(analysis.time?.issue_dates?.closing, analysis.time?.issue_dates?.opening)

  const title = [`${analysis.company_name} IPO`, gmp, deadline?.replace(/\.$/, '')]
    .filter(Boolean)
    .join(' \u00b7 ')

  const description = buildShareDescription({
    companyName: analysis.company_name,
    slug: id,
    score: Number(overallScoreOf(analysis).toFixed(1)),
    gmp: analysis.gmp_price_gain ?? ipo?.gmp_price_gain,
    opening: analysis.time?.issue_dates?.opening,
    closing: analysis.time?.issue_dates?.closing,
    businessModel: analysis.fundamentals?.business_model || analysis.fundamentals?.summary,
  })

  const keywords = [
    `${analysis.company_name} IPO`,
    `${analysis.company_name} IPO analysis`,
    `${analysis.company_name} IPO review`,
    'IPO investment analysis',
    'IPO fundamentals',
    'IPO risk assessment',
    'IPO gains potential',
    'IPO performance analysis',
    'Stock market IPO',
    'IPO allotment',
    'IPO listing gains',
    `${analysis.company_name} stock analysis`,
    'IPO investment guide',
    'IPO rating',
    'IPO score'
  ]

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,

    // Names the per-IPO card explicitly, since openGraphBase's site card would otherwise win.
    openGraph: {
      ...openGraphBase(),
      images: [{ url: `/analysis/${id}/opengraph-image`, width: 1200, height: 630, alt: `${analysis.company_name} IPO analysis on ${SITE_NAME}` }],
      type: 'article',
      title,
      description,
      url: `/analysis/${id}`,
      publishedTime: analysis.created_at ? String(analysis.created_at) : undefined,
      modifiedTime: analysis.updated_at ? String(analysis.updated_at) : undefined,
      section: 'IPO Analysis',
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/analysis/${id}/twitter-image`],
      creator: '@ipomilega',
    },

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

    alternates: {
      canonical: `/analysis/${id}`,
    },

    category: 'Finance',
  }
}

/** JSON-LD: the analysis as an Article, an FAQ of its key facts, and the breadcrumb trail. An FAQ entry with no fact is left out. */
function generateStructuredData(analysis: IpoComprehensiveAnalysis, ipo: Ipo | undefined, id: string) {
  const name = analysis.company_name
  const url = `${SITE_URL}/analysis/${id}`
  const organization = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }
  const opening = formatDay(analysis.time?.issue_dates?.opening)
  const closing = formatDay(analysis.time?.issue_dates?.closing)
  const allotment = formatDay(ipo?.ipo_dates?.basis_of_allotment || analysis.time?.allotment_timeline?.date)
  const listing = formatDay(ipo?.ipo_dates?.ipo_listing_date || analysis.time?.listing_details?.expected_date)
  const exchanges = analysis.time?.listing_details?.exchanges?.filter(Boolean).join(' and ')
  const gmp = gmpLine(analysis.gmp_price_gain ?? ipo?.gmp_price_gain)
  const priceBand = analysis.ipo_details?.price_band

  const faq: [string, string | null][] = [
    [`What is the price band of the ${name} IPO?`, priceBand ? `The ${name} IPO price band is ${priceBand}.` : null],
    [`What is the ${name} IPO GMP?`, gmp ? `The latest grey market premium is ${gmp.replace(/^GMP /, '')}. GMP is unofficial and changes daily.` : null],
    [`When does the ${name} IPO open and close?`, opening && closing ? `Bidding opens on ${opening} and closes on ${closing}.` : null],
    [`What is the ${name} IPO allotment date?`, allotment ? `The basis of allotment is expected on ${allotment}.` : null],
    [`When will ${name} shares list?`, listing ? `Listing is expected on ${listing}${exchanges ? ` on ${exchanges}` : ''}.` : null],
    [`Where can I check ${name} IPO allotment status?`, `Once allotment is out, check it on the registrar's website or on the BSE or NSE allotment status page, using your PAN or application number.`],
    [`What is IPO Milega's score for the ${name} IPO?`, `${overallScoreOf(analysis).toFixed(1)}/10, the average of its fundamentals, risk, performance, flexibility and timing scores.${analysis.fundamentals?.summary ? ` ${analysis.fundamentals.summary}` : ''}`],
  ]

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: `${name} IPO analysis`,
        description: `${name} IPO analysis: financials, risk factors, peer comparison and an overall score.`,
        url,
        datePublished: analysis.created_at,
        dateModified: analysis.updated_at ?? analysis.created_at,
        author: organization,
        publisher: organization,
        about: { '@type': 'Corporation', name, description: analysis.fundamentals?.business_model },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq
          .filter((qa): qa is [string, string] => Boolean(qa[1]))
          .map(([question, answer]) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: answer },
          })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'IPO Analysis', item: `${SITE_URL}/analysis` },
          { '@type': 'ListItem', position: 3, name: `${name} IPO analysis`, item: url },
        ],
      },
    ],
  }
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAnalysisBySlug(id)

  if (!data) {
    return (
      <div className="min-h-screen font-sans bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-[#93c5fd] rounded-full flex items-center justify-center">
              <FileSearch className="h-8 w-8 text-white" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Analysis in progress
              </h1>
              <p className="text-slate-600 leading-relaxed">
                We&apos;re still working through this IPO&apos;s prospectus. The analysis
                shows up here once we&apos;ve reviewed it.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-[#93c5fd] rounded-lg border border-[#93c5fd]">
            <Clock className="h-5 w-5 text-white animate-pulse" />
            <span className="text-sm font-medium text-white">
              Should be ready soon
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <ArrowLeftCircle className="h-5 w-5" />
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
    )
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateStructuredData(data.ipos_analysis, data.ipo, id)) }}
      />
      <AnalysisPageClient analysis={data.ipos_analysis} ipo={data.ipo} />
    </>
  )
}

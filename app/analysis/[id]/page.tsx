import { Metadata } from 'next'
import { AnalysisDetail } from "@/components/analysis/detail/AnalysisDetail"
import { getShareFacts } from "@/components/analysis/detail/analysis-facts"
import { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis"
import { Ipo } from '@/types/ipo';
import { getAnalysisBySlug, getAnalysisSlugs } from '@/lib/queries/ipos';
import { getIpoArticles } from '@/lib/queries/blogs';
import { buildShareDescription, gmpLine, overallScoreOf, openGraphBase, SITE_NAME, SITE_URL } from '@/lib/seo/share';
import { JsonLd, ORGANIZATION_ID } from '@/lib/seo/json-ld';
import { formatIpoDate, formatIstTimestamp } from '@/lib/ipo-format';
import { FileSearch } from 'lucide-react';
import { ArrowLink } from '@/components/ui/ArrowLink';
import { EmptyState } from '@/components/ui/EmptyState';

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
      title: 'IPO analysis not found',
      description: "We couldn't find an analysis for this IPO.",
      robots: { index: false },
    }
  }

  const title = entityTitle(analysis.company_name)

  const description = buildShareDescription({
    ...getShareFacts(analysis, ipo!),
    score: Number(overallScoreOf(analysis).toFixed(1)),
  })

  return {
    title,
    description,
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

    alternates: {
      canonical: `/analysis/${id}`,
    },

    category: 'Finance',
  }
}

/** The entity page's title, shared by its metadata and JSON-LD. */
const entityTitle = (name: string) => `${name} IPO: GMP, Price, Dates, Lot Size & Allotment`

/** JSON-LD: the analysis as an Article and an FAQ of its key facts. An FAQ entry with no fact is left out. */
function generateStructuredData(analysis: IpoComprehensiveAnalysis, ipo: Ipo | undefined, id: string) {
  const name = analysis.company_name
  const url = `${SITE_URL}/analysis/${id}`
  const organization = { '@id': ORGANIZATION_ID }
  const opening = formatIpoDate(analysis.time?.issue_dates?.opening)
  const closing = formatIpoDate(analysis.time?.issue_dates?.closing)
  const allotment = formatIpoDate(ipo?.ipo_dates?.basis_of_allotment || analysis.time?.allotment_timeline?.date)
  const listing = formatIpoDate(ipo?.ipo_dates?.ipo_listing_date || analysis.time?.listing_details?.expected_date)
  const exchanges = analysis.time?.listing_details?.exchanges?.filter(Boolean).join(' and ')
  const gmp = gmpLine(ipo?.gmp_price_gain || analysis.gmp_price_gain)
  const gmpUpdatedAt = formatIstTimestamp(ipo?.gmp_scraped_at)
  const priceBand = analysis.ipo_details?.price_band

  const faq: [string, string | null][] = [
    [`What is the price band of the ${name} IPO?`, priceBand ? `The ${name} IPO price band is ${priceBand}.` : null],
    [`What is the ${name} IPO GMP?`, gmp ? `The latest grey market premium is ${gmp.replace(/^GMP /, '')}. GMP is an unofficial grey market indication${gmpUpdatedAt ? `, last updated ${gmpUpdatedAt}` : ''}.` : null],
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
        headline: entityTitle(name),
        description: `${name} IPO price band, issue dates, lot size, grey market premium and allotment status.`,
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
    ],
  }
}

/** Shown for a slug whose prospectus has not been analysed yet. */
function AnalysisInProgress() {
  return (
    <div className="app-container flex min-h-screen flex-col items-start justify-center gap-6 pt-16 sm:items-center">
      <div className="w-full max-w-md">
        <EmptyState
          icon={FileSearch}
          title="Analysis in progress"
          hint="We're still working through this IPO's prospectus. The analysis shows up here once we've reviewed it."
        />
      </div>
      <ArrowLink href="/">Back to home</ArrowLink>
    </div>
  )
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAnalysisBySlug(id)

  if (!data) return <AnalysisInProgress />

  const articles = await getIpoArticles(data.ipo._id)
  return (
    <>
      <JsonLd data={generateStructuredData(data.ipos_analysis, data.ipo, id)} />
      <AnalysisDetail analysis={data.ipos_analysis} ipo={data.ipo} articles={articles} />
    </>
  )
}

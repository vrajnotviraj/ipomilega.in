import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AnalysisDetail } from "@/components/analysis/AnalysisDetail"
import { getShareFacts } from "@/components/analysis/analysis-facts"
import { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis"
import { getAnalysisBySlug, getAnalysisSlugs, getIpoNameBySlug } from '@/lib/queries/ipos';
import { getIpoArticles } from '@/lib/queries/blogs';
import { buildShareDescription, overallScoreOf, openGraphBase, SITE_NAME, SITE_URL } from '@/lib/seo/share';
import { JsonLd, ORGANIZATION_ID, researchAuthor } from '@/lib/seo/json-ld';
import { FileSearch } from 'lucide-react';
import { ArrowLink } from '@/components/ui/ArrowLink';
import { EmptyState } from '@/components/ui/EmptyState';

export const revalidate = 60

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
    const name = await getIpoNameBySlug(id)
    if (name === null) notFound()
    return {
      title: name ? `${name} IPO analysis in progress` : 'IPO analysis in progress',
      description: "We're still working through this IPO's prospectus.",
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

/** JSON-LD: the analysis as an Article, credited to the research desk as the page's byline shows. */
function generateStructuredData(analysis: IpoComprehensiveAnalysis, id: string) {
  const name = analysis.company_name
  const url = `${SITE_URL}/analysis/${id}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entityTitle(name),
    description: `${name} IPO price band, issue dates, lot size, grey market premium and allotment status.`,
    url,
    image: [{ '@type': 'ImageObject', url: `${url}/opengraph-image`, width: 1200, height: 630 }],
    datePublished: analysis.created_at,
    dateModified: analysis.updated_at ?? analysis.created_at,
    author: researchAuthor,
    publisher: { '@id': ORGANIZATION_ID },
    about: { '@type': 'Corporation', name, description: analysis.fundamentals?.business_model },
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

  if (!data) {
    // A slug no IPO has is a real 404; an IPO whose analysis is pending gets the noindexed placeholder.
    if ((await getIpoNameBySlug(id)) === null) notFound()
    return <AnalysisInProgress />
  }

  const articles = await getIpoArticles(data.ipo._id)
  return (
    <>
      <JsonLd data={generateStructuredData(data.ipos_analysis, id)} />
      <AnalysisDetail analysis={data.ipos_analysis} ipo={data.ipo} articles={articles} />
    </>
  )
}

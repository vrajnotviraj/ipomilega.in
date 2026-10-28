import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AnalysisDetail } from "@/components/analysis/AnalysisDetail"
import { getShareFacts } from "@/components/analysis/analysis-facts"
import { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis"
import { getAnalysisBySlug, getIpoNameBySlug } from '@/lib/queries/ipos';
import { getIpoArticles } from '@/lib/queries/blogs';
import { buildShareDescription, openGraphBase, SITE_NAME, SITE_URL, titleFor } from '@/lib/seo/share';
import { fill, LANG_TAG, type Locale, localePath } from '@/lib/i18n/locales';
import { setLocale, t } from '@/lib/i18n/server';
import { indexingFor } from '@/lib/queries/translations';
import { adjustedScoreOf } from '@/lib/ipo/score';
import { JsonLd, ORGANIZATION_ID, researchAuthor } from '@/lib/seo/json-ld';
import { FileSearch } from 'lucide-react';
import { ArrowLink } from '@/components/ui/ArrowLink';
import { EmptyState } from '@/components/ui/EmptyState';

export const revalidate = 60

type Params = { params: Promise<{ lang: string; id: string }> }

// Builds no pages ahead; each renders on its first visit and is then cached.
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang: langParam, id } = await params
  const lang = setLocale(langParam)
  const data = await getAnalysisBySlug(id, lang)
  const analysis = data?.ipos_analysis
  const ipo = data?.ipo
  const d = t().analysis

  if (!analysis) {
    const name = await getIpoNameBySlug(id)
    if (name === null) notFound()
    return {
      title: name ? fill(d.meta.pendingTitle, { name }) : d.meta.pendingTitleNoName,
      description: d.meta.pendingDescription,
      robots: { index: false },
    }
  }

  const title = fill(d.meta.entityTitle, { name: analysis.company_name })

  const description = buildShareDescription(
    {
      ...getShareFacts(analysis, ipo!),
      score: adjustedScoreOf({ analysis, ipo: ipo! }),
    },
    d.share
  )

  return {
    title: titleFor(title),
    description,
    // Names the per-IPO card explicitly, since openGraphBase's site card would otherwise win.
    openGraph: {
      ...openGraphBase(lang),
      images: [{ url: `/analysis/${id}/opengraph-image`, width: 1200, height: 630, alt: fill(d.meta.imageAlt, { name: analysis.company_name, site: SITE_NAME }) }],
      type: 'article',
      title,
      description,
      url: localePath(lang, `/analysis/${id}`),
      publishedTime: analysis.created_at ? String(analysis.created_at) : undefined,
      modifiedTime: analysis.updated_at ? String(analysis.updated_at) : undefined,
      section: d.meta.section,
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/analysis/${id}/twitter-image`],
      creator: '@ipomilega',
    },

    ...(await indexingFor('analysis', analysis._id, lang, `/analysis/${id}`)),

    category: 'Finance',
  }
}

/** JSON-LD: the analysis as an Article, credited to the research desk as the page's byline shows. */
function generateStructuredData(analysis: IpoComprehensiveAnalysis, id: string, lang: Locale) {
  const name = analysis.company_name
  const url = `${SITE_URL}${localePath(lang, `/analysis/${id}`)}`
  const d = t().analysis.meta

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: fill(d.entityTitle, { name }),
    description: fill(d.description, { name }),
    url,
    inLanguage: LANG_TAG[lang],
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
  const d = t()
  return (
    <div className="app-container flex min-h-screen flex-col items-start justify-center gap-6 pt-16 sm:items-center">
      <div className="w-full max-w-md">
        <EmptyState icon={FileSearch} title={d.analysis.inProgress.title} hint={d.analysis.inProgress.hint} />
      </div>
      <ArrowLink href="/">{d.common.backToHome}</ArrowLink>
    </div>
  )
}

export default async function AnalysisPage({ params }: Params) {
  const { lang: langParam, id } = await params
  const lang = setLocale(langParam)
  const data = await getAnalysisBySlug(id, lang)

  if (!data) {
    // A slug no IPO has is a real 404; an IPO whose analysis is pending gets the noindexed placeholder.
    if ((await getIpoNameBySlug(id)) === null) notFound()
    return <AnalysisInProgress />
  }

  const articles = await getIpoArticles(data.ipo._id, lang)
  return (
    <>
      <JsonLd data={generateStructuredData(data.ipos_analysis, id, lang)} />
      <AnalysisDetail analysis={data.ipos_analysis} ipo={data.ipo} articles={articles} />
    </>
  )
}

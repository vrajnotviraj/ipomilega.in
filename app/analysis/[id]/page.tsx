import { Metadata } from 'next'
import AnalysisPageClient from './AnalysisPageClient'
import { IpoComprehensiveAnalysis } from "@/app/models/ipo_comprehensive_analysis"
import { Ipo } from '@/app/models/ipo';
import { getAnalysisBySlug, getAllAnalyses } from '@/lib/queries/ipos';
import { buildShareDescription, closingLine, gmpLine, SITE_NAME } from '@/lib/share';
import {  ArrowLeftCircle, Clock, FileSearch } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

// ISR: prerendered per slug, refreshed in the background every 5 minutes.
export const revalidate = 300
// Slugs published after the build still render on first request, then get cached.
export const dynamicParams = true

// Prerender every analysis slug at build time so the common case is a static file.
export async function generateStaticParams() {
  try {
    const analyses = await getAllAnalyses()
    return analyses
      .map((a) => a.slug)
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => ({ id: slug }))
  } catch {
    return []
  }
}

// Reads Mongo in-process. This previously fetched the app's own /api/analysis/[id] route over
// HTTP with `cache: 'no-store'`, and because both generateMetadata and the page component call
// it, every page view did that twice -- two HTTP round-trips, two full scans of the `ipos`
// collection, nothing reused. getAnalysisBySlug is wrapped in React `cache`, so the two calls
// below now share a single database read.

// The page body scores an issue as the mean of its five section scores. Both call sites below
// used to reimplement that from `summary_metrics` with misplaced parentheses -- one read
// `a + b / 2`, the other `(a ?? 0 + b) / 2` -- which is how a share card ended up advertising
// "12.0/10". Compute it once, the same way the page does.
function overallScoreOf(analysis: IpoComprehensiveAnalysis): number {
  const sections = [
    analysis.fundamentals?.score,
    analysis.risk_meter?.score,
    analysis.performance?.score,
    analysis.flexibility?.score,
    analysis.time?.score,
  ].map((n) => n ?? 0)

  return sections.reduce((sum, n) => sum + n, 0) / sections.length
}

// Generate dynamic metadata - FIXED: Changed params to Promise type
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params // Await the params Promise
  const data = await getAnalysisBySlug(id)
  const analysis = data?.ipos_analysis
  const ipo = data?.ipo
  
  if (!analysis) {
    return {
      title: 'IPO Analysis Not Found',
      description: 'The requested IPO analysis could not be found.',
    }
  }

  const overallScore = overallScoreOf(analysis).toFixed(1)
  
  // The link-preview copy is built from the same module the in-app Share dialog uses, so a
  // pasted WhatsApp message and the card WhatsApp renders underneath it tell the same story:
  // the GMP, how long is left to apply, one line on the business, and where to read more.
  const gmp = gmpLine(analysis.gmp_price_gain ?? ipo?.gmp_price_gain)
  const deadline = closingLine(analysis.time?.issue_dates?.closing, analysis.time?.issue_dates?.opening)

  const title = [`${analysis.company_name} IPO`, gmp, deadline?.replace(/\.$/, '')]
    .filter(Boolean)
    .join(' \u00b7 ')

  const description = buildShareDescription({
    companyName: analysis.company_name,
    slug: id,
    score: Number(overallScore),
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
    authors: [{ name: 'IPO Analysis Team' }],
    creator: 'IPO Analysis Platform',
    publisher: 'IPO Analysis Platform',
    
    // Open Graph metadata for social sharing
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/analysis/${id}`,
      siteName: 'IPO Analysis Platform',
      // Deliberately our own card, never `ipo.image_url`: a shared link should carry the IPO
      // Milega mark, not the issuing company's logo, which reads as if the company published it.
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - ${analysis.company_name} IPO analysis`,
        }
      ],
      locale: 'en_IN',
    },
    
    // Twitter Card metadata
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
      creator: '@ipomilega',
    },
    
    // Additional SEO metadata
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
    
    // Structured data for rich snippets
    other: {
      'article:published_time': new Date().toISOString(),
      'article:modified_time': new Date().toISOString(),
      'article:author': 'IPO Analysis Team',
      'article:section': 'IPO Analysis',
      'article:tag': keywords.slice(0, 5).join(','),
    },
    
    // Canonical URL
    alternates: {
      canonical: `/analysis/${id}`,
    },
    
    // Additional metadata
    category: 'Finance',
    classification: 'IPO Analysis',
  }
}

// Generate JSON-LD structured data
function generateStructuredData(analysis: IpoComprehensiveAnalysis, id: string) {
  const overallScore = overallScoreOf(analysis).toFixed(1)
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: `${analysis.company_name} IPO`,
    description: `Comprehensive IPO analysis of ${analysis.company_name} with detailed fundamentals, risk assessment, and investment potential evaluation.`,
    provider: {
      '@type': 'Organization',
      name: 'IPO Analysis Platform',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: analysis.ipo_details.price_band,
      availability: 'https://schema.org/InStock',
      validFrom: analysis.time.issue_dates.opening,
      validThrough: analysis.time.issue_dates.closing,
    },
    review: {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: overallScore,
        bestRating: '10',
        worstRating: '0',
      },
      author: {
        '@type': 'Organization',
        name: 'IPO Analysis Team',
      },
      reviewBody: analysis.fundamentals.summary,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: overallScore,
      bestRating: '10',
      worstRating: '0',
      ratingCount: '1',
    },
    url: `/analysis/${id}`,
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    mainEntity: {
      '@type': 'Corporation',
      name: analysis.company_name,
      description: analysis.fundamentals.business_model,
    }
  }
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = await getAnalysisBySlug(id)

  if (!analysis) {
    return (
      <div className="min-h-screen font-ibm-plex bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center space-y-6">
          {/* Icon and Status */}
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-[#93c5fd] rounded-full flex items-center justify-center">
              <FileSearch className="h-8 w-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Analysis In Progress
              </h1>
              <p className="text-slate-600 leading-relaxed">
                We&apos;re currently preparing a comprehensive analysis for this IPO. 
                Our team is working diligently to provide you with detailed insights.
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-3 p-4 bg-[#93c5fd] rounded-lg border border-[#93c5fd]">
            <Clock className="h-5 w-5 text-white animate-pulse" />
            <span className="text-sm font-medium text-white">
              Expected completion: Soon
            </span>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <ArrowLeftCircle className="h-5 w-5" />
              Back to Home
            </Link>
          </div>

          {/* Additional info */}
          {/* <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Want to be notified when ready?{" "}
              <button className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium">
                Set up alerts
              </button>
            </p>
          </div> */}
        </CardContent>
      </Card>
    </div>
    )
  }

  const structuredData = generateStructuredData(analysis.ipos_analysis, id)

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      {/* Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: '/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'IPO Analysis',
                item: '/admin',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: `${analysis.ipos_analysis.company_name} Analysis`,
                item: `/analysis/${id}`,
              },
            ],
          })
        }}
      />
      
      <AnalysisPageClient analysis={analysis.ipos_analysis} ipo={analysis.ipo} />
    </>
  )
}

import { Metadata } from 'next'
import AnalysisPageClient from './AnalysisPageClient'
import { IpoComprehensiveAnalysis } from "@/app/models/ipo_comprehensive_analysis"
import { Ipo } from '@/app/models/ipo';
import { getAnalysisBySlug, getAllAnalyses } from '@/lib/queries/ipos';
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

  const overallScore = ((analysis.summary_metrics?.fundamentals_score ?? 0) + (analysis.summary_metrics?.performance_score ?? 0) / 2).toFixed(1)
  const gainsPercentage = analysis.ipo_details.approximate_gains_potential
  
  const title = `${analysis.company_name} IPO Analysis - Score ${overallScore}/10 | ${gainsPercentage}% Potential Gains`
  const description = `Comprehensive IPO analysis of ${analysis.company_name}. Issue size: ${analysis.ipo_details.issue_size}, Price band: ${analysis.ipo_details.price_band}. Investment score ${overallScore}/10 with ${gainsPercentage}% potential gains. Risk assessment, fundamentals review & timeline details.`
  
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
      images: [
        {
          url: `${ipo?.image_url}`, // You'll need to create this
          width: 1200,
          height: 630,
          alt: `${analysis.company_name} IPO Analysis`,
        }
      ],
      locale: 'en_IN',
    },
    
    // Twitter Card metadata
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${ipo?.image_url}`], // You'll need to create this
      creator: '@yourtwitterhandle', // Replace with your Twitter handle
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
  const overallScore = ((analysis.summary_metrics?.fundamentals_score ?? 0 + (analysis.summary_metrics?.performance_score ?? 0)) / 2).toFixed(1)
  
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

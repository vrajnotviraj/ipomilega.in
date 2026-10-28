import "../globals.css";
import type { Metadata } from "next";
import { DM_Mono, Figtree, Noto_Sans_Devanagari, Noto_Sans_Gujarati, Schibsted_Grotesk } from "next/font/google";
import SiteChrome from "@/components/layout/SiteChrome";
import { LocaleProvider } from "@/lib/i18n/client";
import { notFound } from "next/navigation";
import { isLocale, LANG_TAG } from "@/lib/i18n/locales";
import { setLocale, t } from "@/lib/i18n/server";
import { DICTIONARIES } from "@/messages";
import { openGraphBase, SITE_NAME, SITE_URL } from "@/lib/seo/share";
import { JsonLd, siteJsonLd } from "@/lib/seo/json-ld";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", preload: false });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", preload: false });
// Fallbacks for Hindi and Gujarati text. A page without those scripts never downloads them.
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-devanagari", preload: false });
const gujarati = Noto_Sans_Gujarati({ subsets: ["gujarati"], variable: "--font-gujarati", preload: false });
const FONT_CLASSES = [figtree, schibsted, dmMono, devanagari, gujarati].map((font) => font.variable).join(" ");

type Params = { params: Promise<{ lang: string }> };

// Builds no pages ahead, so the build needs no database; each renders on its first visit and is then cached.
export const generateStaticParams = () => [];

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const lang = setLocale((await params).lang);
  const { meta } = t().common;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: meta.title, template: meta.template },
    description: meta.description,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: { googleBot: { "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: openGraphBase(lang),
    twitter: { card: "summary_large_image", site: "@ipomilega" },
  };
}

export default async function RootLayout({ children, params }: Params & { children: React.ReactNode }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  setLocale(lang);
  return (
    <html lang={LANG_TAG[lang]} className={FONT_CLASSES}>
      <body className="min-h-screen">
        <JsonLd data={siteJsonLd} />
        <LocaleProvider locale={lang} dictionary={DICTIONARIES[lang]}>
          <SiteChrome>{children}</SiteChrome>
        </LocaleProvider>
      </body>
    </html>
  );
}

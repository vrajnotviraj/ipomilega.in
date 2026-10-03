import "./globals.css";
import type { Metadata } from "next";
import { DM_Mono, Figtree, Schibsted_Grotesk } from "next/font/google";
import SiteChrome from "@/components/layout/SiteChrome";
import { openGraphBase, SITE_NAME, SITE_URL } from "@/lib/seo/share";
import { JsonLd, siteJsonLd } from "@/lib/seo/json-ld";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", preload: false });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "IPO Milega | Every Indian IPO, scored",
    template: "%s | IPO Milega",
  },
  description:
    "Track live IPOs, upcoming listings and past performance with a manually reviewed analysis of every RHP/DRHP filing.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: { googleBot: { "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: openGraphBase(),
  twitter: { card: "summary_large_image", site: "@ipomilega" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${figtree.variable} ${schibsted.variable} ${dmMono.variable}`}>
      <body className="min-h-screen">
        <JsonLd data={siteJsonLd} />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}

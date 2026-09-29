import "./globals.css";
import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import SiteChrome from "@/components/SiteChrome";
import { openGraphBase, SITE_NAME } from "@/lib/share";

// Now a server component. It previously carried "use client", which meant every route
// re-mounted the whole shell on the client, shipped better-auth/framer-motion/radix in the
// shared bundle, and could not export `metadata` at all (Next forbids it in client files).
// Self-hosted via next/font: the Google Fonts stylesheet was render-blocking and chained two
// extra origins (css -> woff2) in front of first paint. globals.css maps these variables onto
// Tailwind's font-sans / font-mono / font-serif.
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });
// No opsz axis: it more than doubled each file (~140KB vs ~60KB) for a subtle optical-size
// tweak. Not preloaded either, so it never competes with the LCP text, which is Plex Sans.
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-newsreader", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL("https://ipomilega.in"),
  title: {
    default: "IPO Milega | Every Indian IPO, Scored",
    template: "%s | IPO Milega",
  },
  description:
    "Track live IPOs, upcoming listings and past performance with AI-generated analysis of every RHP/DRHP filing.",
  applicationName: SITE_NAME,
  openGraph: openGraphBase(),
  twitter: { card: "summary_large_image", site: "@ipomilega" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable} ${newsreader.variable}`}>
      <body className="min-h-screen items-center">
        {/* No <Suspense> wrapper: the page's data wait bubbled up to it, so the whole body shipped
            hidden and only appeared once an inline script revealed it. useSearchParams is
            already quarantined inside ProgressProvider. */}
        <SiteChrome>{children}</SiteChrome>
      </body>
      {/* Google Analytics: only loads when a Measurement ID is configured (e.g. G-XXXXXXXXXX),
          so local dev and staging without the env var send nothing. The component also tracks
          client-side route changes, which a plain gtag snippet would miss in the App Router. */}
      {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
    </html>
  );
}

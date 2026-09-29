import "./globals.css";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import SiteChrome from "@/components/layout/SiteChrome";
import { openGraphBase, SITE_NAME } from "@/lib/share";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });
// Not preloaded so it never competes with the LCP text, which is Plex Sans.
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable} ${newsreader.variable}`}>
      {/* No <Suspense> around the body: it would hide the whole page until hydration. */}
      <body className="min-h-screen items-center">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}

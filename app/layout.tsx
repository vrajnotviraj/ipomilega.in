import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import SiteChrome from "@/components/SiteChrome";

// Now a server component. It previously carried "use client", which meant every route
// re-mounted the whole shell on the client, shipped better-auth/framer-motion/radix in the
// shared bundle, and could not export `metadata` at all (Next forbids it in client files).
export const metadata: Metadata = {
  metadataBase: new URL("https://ipomilega.in"),
  title: {
    default: "IPO Milega - Your Gateway to IPO Investments",
    template: "%s | IPO Milega",
  },
  description:
    "Track live IPOs, upcoming listings and past performance with AI-generated analysis of every RHP/DRHP filing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Warm the DNS/TLS path to the font host before the stylesheet request goes out,
            and to the S3 bucket every IPO logo is served from. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://ipomilega-assests.s3.ap-south-1.amazonaws.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,500&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen items-center">
        <Suspense>
          <SiteChrome>{children}</SiteChrome>
        </Suspense>
      </body>
      {/* Google Analytics: only loads when a Measurement ID is configured (e.g. G-XXXXXXXXXX),
          so local dev and staging without the env var send nothing. The component also tracks
          client-side route changes, which a plain gtag snippet would miss in the App Router. */}
      {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
    </html>
  );
}

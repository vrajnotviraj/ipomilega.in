import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A self-contained server in .next/standalone that loads only the files it uses: ~40 MB less memory than next start.
  output: "standalone",
  // Pin the project root so a stray lockfile in a parent folder isn't picked as the workspace root.
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  // Caps stale-while-revalidate at an hour; the default of a year lets CDNs serve a stale homepage for too long.
  expireTime: 3600,
  // PostHog reverse proxy. Its API paths end in a slash (`/e/`), so Next must not redirect them.
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  // Puts metadata in <head> for every visitor. Streamed into <body>, AI crawlers, link unfurlers and Lighthouse can miss
  // the description and canonical. The pages await the same cached reads anyway.
  htmlLimitedBots: /.*/,
  // The whole stylesheet is ~12 KB gzipped, so it ships inside the HTML instead of as a render-blocking request.
  experimental: { inlineCss: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // ponytail: no script-src yet; Next's inline scripts and PostHog need a nonce-based CSP to lock scripts down.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The bare domain moves to www, the canonical host.
      { source: "/:path*", has: [{ type: "host", value: "ipomilega.in" }], destination: "https://www.ipomilega.in/:path*", permanent: true },
      // /analysis has no index page, so it redirects to /ipos. Each IPO keeps its page at /analysis/[slug].
      { source: "/analysis", destination: "/ipos", permanent: true },
      { source: "/:lang(hi|gu)/analysis", destination: "/:lang/ipos", permanent: true },
      // English lives at the bare path; /en is only the internal route name.
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      // After static files and route handlers, so only page paths reach the [lang] segment.
      afterFiles: [
        { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
        { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
        { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
        { source: "/", destination: "/en" },
        { source: "/:path((?!api/|ingest/|_next/|hi$|hi/|gu$|gu/).*)", destination: "/en/:path" },
      ],
      fallback: [],
    };
  },
  images: {
    // S3 objects send no Cache-Control and logos/covers are keyed by id, so cache them for 30 days.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipomilega-assests.s3.ap-south-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root so a stray lockfile in a parent folder isn't picked as the workspace root.
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  // `next dev` wipes its build dir on boot, so it builds into `.next-dev` to not break a `next start` in the same folder.
  distDir:
    process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === "development" ? ".next-dev" : ".next"),
  // Caps stale-while-revalidate at an hour; the default of a year lets CDNs serve a stale homepage for too long.
  expireTime: 3600,
  // PostHog reverse proxy. Its API paths end in a slash (`/e/`), so Next must not redirect them.
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
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
    // The analysis index was folded into /ipos; each IPO still has its page at /analysis/[slug].
    return [{ source: "/analysis", destination: "/ipos", permanent: true }];
  },
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
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

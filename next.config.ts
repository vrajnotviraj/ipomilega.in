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

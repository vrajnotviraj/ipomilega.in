import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` wipes its build directory on boot, which pulls files out from under a server
  // started by `next start` from the same directory -- running both (staging on :3100, dev on
  // :3000) left the production server reading half-deleted manifests. Dev therefore builds into
  // its own `.next-dev`; override with NEXT_DIST_DIR if needed.
  distDir:
    process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === "development" ? ".next-dev" : ".next"),
  // ISR pages go out with `s-maxage=<revalidate>, stale-while-revalidate=<expireTime - revalidate>`.
  // The default expireTime is a year, which lets any CDN/proxy in front keep handing out a
  // stale homepage "while revalidating" more or less indefinitely -- the refresh-until-it-
  // updates symptom. Cap staleness at an hour; nothing on the site should be older than that.
  expireTime: 3600,
  images: {
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

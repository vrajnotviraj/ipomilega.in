import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` wipes its build directory on boot, which pulls files out from under a server
  // started by `next start` from the same directory -- running both (staging on :3100, dev on
  // :3000) left the production server reading half-deleted manifests. Dev therefore builds into
  // its own `.next-dev`; override with NEXT_DIST_DIR if needed.
  distDir:
    process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === "development" ? ".next-dev" : ".next"),
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

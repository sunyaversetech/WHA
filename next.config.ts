import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Upload filenames are timestamped (e.g. profile_1793606395906.png),
    // so a given URL's content never changes — safe to cache the optimized
    // output for a month instead of Next's 4-hour default, which was
    // forcing a cold re-optimization of the same hero image on every
    // visitor's first load within a cache miss window.
    minimumCacheTTL: 2678400, // 31 days
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "wha-sunya-my-uploads.s3.ap-southeast-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },
  output: "standalone",
};

export default nextConfig;

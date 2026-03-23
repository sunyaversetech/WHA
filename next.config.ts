import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
    ],
  },
  output: "standalone",
};

export default nextConfig;

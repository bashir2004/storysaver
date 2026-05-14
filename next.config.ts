import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow our own proxy route to serve Instagram images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
      },
    ],
    // Use unoptimized for proxied images (we handle sizing ourselves)
    unoptimized: true,
  },
  // Increase API route body size limit for media proxy
  experimental: {},
};

export default nextConfig;

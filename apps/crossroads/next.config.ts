// apps/crossroads/next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mixtape/core", "@mixtape/api", "@mixtape/content"],
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  allowedDevOrigins: ["http://127.0.0.1:3010", "http://localhost:3010"],

  async rewrites() {
    return [
      // Route /app and anything under it to the Mixtape app zone.
      // IMPORTANT: keep `/app` in the destination path.
      // The Mixtape app is built with `basePath: "/app"` and emits internal
      // RSC/navigation requests like `/app?_rsc=...`. Removing `/app` here
      // breaks those requests and causes `_not-found` responses.
      {
        source: "/app",
        destination: "https://app.crossroads.place/app",
      },
      {
        source: "/app/:path*",
        destination: "https://app.crossroads.place/app/:path*",
      },
    ];
  },
};

export default nextConfig;

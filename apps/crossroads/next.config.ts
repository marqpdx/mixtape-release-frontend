// apps/crossroads/next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@mixtape/core",
    "@mixtape/api",
    "@mixtape/content",
    "leaflet",
    "react-leaflet",
    "framer-motion",
    "motion-dom",
  ],
  allowedDevOrigins: ["http://127.0.0.1:3010", "http://localhost:3010"],

  async headers() {
    return [
      {
        // CSP for the Crossroads Page public group route only.
        // Primary control: sanitized template slots (typed values via React JSX).
        // This header is the defense-in-depth backstop (DB-0002 Decision 2).
        // Negative lookahead excludes known non-group top-level routes so that
        // Next.js hydration scripts aren't blocked on those pages.
        source: "/:slug((?!get-started$|about$|pricing$|contact$)[a-z][a-z0-9-]*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

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

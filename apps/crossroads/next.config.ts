// apps/crossroads/next.config.ts

import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Static/stable-URL assets only — do not point next/image at Stash
    // presigned URLs (expiring signature query params defeat next/image's
    // URL-keyed optimizer cache). Signed asset URLs should render via
    // Chakra Image instead. See decisions/argus/audit-blocks/image-handling-01.md.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.crossroads.place",
      },
      // Local MinIO for development
      ...(!isProd
        ? [
            { protocol: "http" as const, hostname: "127.0.0.1", port: "9000" },
            { protocol: "http" as const, hostname: "localhost", port: "9000" },
          ]
        : []),
    ],
  },
  transpilePackages: [
    "@mixtape/core",
    "@mixtape/api",
    "@mixtape/content",
    "leaflet",
    "react-leaflet",
    "framer-motion",
    "motion-dom",
  ],
  allowedDevOrigins: [
    "http://127.0.0.1:3010",
    "http://localhost:3010",
    // Tenant subdomains used in local dev testing (e.g. mindful-brilliance-test.localhost:3010)
    "http://mindful-brilliance.localhost:3010",
    "http://mindful-brilliance-test.localhost:3010",
  ],

  async headers() {
    return [
      {
        // CSP for the Crossroads Page public group route only.
        // Primary control: sanitized template slots (typed values via React JSX).
        // This header is the defense-in-depth backstop (DB-0002 Decision 2).
        // Negative lookahead excludes known non-group top-level routes so that
        // Next.js hydration scripts aren't blocked on those pages.
        // catalyst excluded: it is an authenticated app route, not a public group page.
        source: "/:slug((?!get-started$|about$|pricing$|contact$|catalyst$)[a-z][a-z0-9-]*)",
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
    const appBase =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3011"
        : "https://app.crossroads.place";
    return [
      // Route /app and anything under it to the Mixtape app zone.
      // IMPORTANT: keep `/app` in the destination path.
      // The Mixtape app is built with `basePath: "/app"` and emits internal
      // RSC/navigation requests like `/app?_rsc=...`. Removing `/app` here
      // breaks those requests and causes `_not-found` responses.
      {
        source: "/app",
        destination: `${appBase}/app`,
      },
      {
        source: "/app/:path*",
        destination: `${appBase}/app/:path*`,
      },
    ];
  },
};

export default nextConfig;

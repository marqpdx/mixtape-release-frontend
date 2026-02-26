// apps/mixtape/next.config.ts

import type { NextConfig } from 'next';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';

// Build connect-src based on environment
const connectSrc = [
  "'self'",
  // API + Chat (always)
  "https://api.crossroads.place",
  "https://chat.crossroads.place",
  "wss://chat.crossroads.place",
  // Dev-only backends (local API + Socket.IO)
  ...(isProd
    ? []
    : [
        "http://localhost:8010",
        "http://127.0.0.1:8010",
        "http://localhost:5001",
        "http://127.0.0.1:5001",
        "ws://localhost:5001",
        "ws://127.0.0.1:5001",
        "http://localhost:8011",
        "http://127.0.0.1:8011",
      ]),
].join(' ');

// If you load Google Fonts, uncomment these two lines:
// const styleSrc = "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com";
// const fontSrc  = "font-src 'self' data: https://fonts.gstatic.com";

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "img-src 'self' https: data: blob: http://127.0.0.1:9000 http://localhost:9000",
      "media-src 'self' https: data: blob: https://assets.crossroads.place" +
        (isProd ? "" : " http://127.0.0.1:9000 http://localhost:9000"),
      // Next/Chakra often need these; remove 'unsafe-eval' if/when you can
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://api.crossroads.place",
      // Optional: upgrade HTTP subresources to HTTPS in prod
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Modern syntax (OK as provided)
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
  // HSTS (safe even on Vercel; only effective over HTTPS)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Legacy; harmless
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: "/app",
  outputFileTracingRoot: path.join(__dirname, '../..'),
  allowedDevOrigins: ["http://127.0.0.1:3011", "http://localhost:3011"],
  async headers() {
    return [
      {
        // source: '/:path*',
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    // basePath: "/app" moves public/ to /app/*, but browsers request /favicon.ico at root.
    // Next.js requires an absolute URL for rewrites outside basePath.
    const selfUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3011}`;
    return [
      {
        source: "/favicon.ico",
        destination: `${selfUrl}/app/favicon.ico`,
        basePath: false,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Suppress the annoying "Serializing big strings" warning
    config.infrastructureLogging = {
      level: 'error',
      ...(config.infrastructureLogging || {}),
    };
    return config;
  },
};

export default nextConfig;

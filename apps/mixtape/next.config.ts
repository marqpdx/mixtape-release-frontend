// next.config.ts

import type { NextConfig } from 'next';

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
      "img-src 'self' https: http://127.0.0.1:9000 http://localhost:9000 data: blob:;",
      // Next/Chakra often need these; remove 'unsafe-eval' if/when you can
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data: blob:",
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
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS (safe even on Vercel; only effective over HTTPS)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Legacy; harmless
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async headers() {
    return [
      {
        // source: '/:path*',
        source: "/(.*)",
        headers: securityHeaders,
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


// // next.config.ts

// import type { NextConfig } from 'next';

// /**
//  * Security Headers Configuration
//  *
//  * These headers protect against common web vulnerabilities:
//  * - XSS (Cross-Site Scripting)
//  * - Clickjacking
//  * - MIME type sniffing
//  * - Information disclosure
//  */
// const securityHeaders = [
//   // Content Security Policy (CSP)
//   // Prevents XSS attacks by controlling which resources can be loaded
//   {
//     key: 'Content-Security-Policy',
//     value: [
//       "default-src 'self'",
//       "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline needed for Next.js
//       "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Chakra UI
//       "img-src 'self' data: https: blob:",
//       "font-src 'self' data:",
//       "connect-src 'self' http://localhost:8010 http://127.0.0.1:8010 https://api.crossroads.place http://localhost:5001 http://127.0.0.1:5001 ws://localhost:5001 ws://127.0.0.1:5001", // Backend API + Socket.IO server
//       "frame-ancestors 'none'",
//       "base-uri 'self'",
//       "form-action 'self'",
//     ].join('; '),
//   },
//   // Prevent clickjacking by disallowing the site from being framed
//   {
//     key: 'X-Frame-Options',
//     value: 'DENY',
//   },
//   // Prevent MIME type sniffing
//   {
//     key: 'X-Content-Type-Options',
//     value: 'nosniff',
//   },
//   // Control referrer information
//   {
//     key: 'Referrer-Policy',
//     value: 'strict-origin-when-cross-origin',
//   },
//   // Control browser features and APIs
//   {
//     key: 'Permissions-Policy',
//     value: 'camera=(), microphone=(), geolocation=()',
//   },
//   // Enable browser XSS filter (legacy but doesn't hurt)
//   {
//     key: 'X-XSS-Protection',
//     value: '1; mode=block',
//   },
//   // Force HTTPS in production
//   // Note: Vercel already sets HSTS, but explicit is better
//   {
//     key: 'Strict-Transport-Security',
//     value: 'max-age=63072000; includeSubDomains; preload',
//   },
// ];

// const nextConfig: NextConfig = {
//   reactStrictMode: true,

//   // Specify the project root for file tracing (resolves lockfile warning)
//   outputFileTracingRoot: __dirname,

//   // Apply security headers to all routes
//   async headers() {
//     return [
//       {
//         source: '/:path*',
//         headers: securityHeaders,
//       },
//     ];
//   },
// };

// export default nextConfig;

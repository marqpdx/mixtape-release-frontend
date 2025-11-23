import type { NextConfig } from 'next';

/**
 * Security Headers Configuration
 *
 * These headers protect against common web vulnerabilities:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME type sniffing
 * - Information disclosure
 */
const securityHeaders = [
  // Content Security Policy (CSP)
  // Prevents XSS attacks by controlling which resources can be loaded
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline needed for Next.js
      "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Chakra UI
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:8010 http://127.0.0.1:8010 https://api.crossroads.place", // Backend API (dev + prod)
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  // Prevent clickjacking by disallowing the site from being framed
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Control browser features and APIs
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // Enable browser XSS filter (legacy but doesn't hurt)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Force HTTPS in production
  // Note: Vercel already sets HSTS, but explicit is better
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Specify the project root for file tracing (resolves lockfile warning)
  outputFileTracingRoot: __dirname,

  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

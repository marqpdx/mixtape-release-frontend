// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Route Protection
 *
 * This runs on the edge before any page is rendered, checking for the
 * presence of the httpOnly refresh token cookie to determine auth status.
 *
 * Security Note: We check for the refresh token cookie (not access token)
 * because the access token is stored in memory and not accessible to middleware.
 */
/**
 * Sanitize URL for logging by removing sensitive query parameters
 */
function sanitizeUrl(url: URL): string {
  const sensitiveParams = [
    'password',
    'token',
    'secret',
    'key',
    'refresh_token',
    'access_token',
    'identifier', // Could contain email (PII)
  ];
  const sanitized = new URL(url);

  sensitiveParams.forEach(param => {
    if (sanitized.searchParams.has(param)) {
      sanitized.searchParams.set(param, '[REDACTED]');
    }
  });

  return `${sanitized.pathname}${sanitized.search}`;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip sensitive query params (never allow them to persist in the URL)
  const urlWithSensitiveParams = ["password", "identifier", "secret", "access_token"].some(
    (param) => request.nextUrl.searchParams.has(param)
  );
  if (urlWithSensitiveParams) {
    const cleanedUrl = new URL(request.nextUrl);
    ["password", "identifier", "secret", "access_token"].forEach((param) =>
      cleanedUrl.searchParams.delete(param)
    );
    return NextResponse.redirect(cleanedUrl);
  }

  // Security: Block requests with sensitive data in query params
  // Credentials should NEVER be in URLs
  if (request.nextUrl.searchParams.has('password') ||
      request.nextUrl.searchParams.has('secret') ||
      request.nextUrl.searchParams.has('access_token')) {
    console.error('[Security] Blocked request with sensitive data in URL:', sanitizeUrl(request.nextUrl));
    return new NextResponse('Bad Request: Sensitive data must not be in URL', { status: 400 });
  }

  // Check for refresh token cookie (try both possible names)
  const refreshToken = request.cookies.get('refresh_token') ||
                       request.cookies.get('refresh') ||
                       request.cookies.get('refreshtoken');

  // Log with sanitized URL (remove passwords/tokens from logs)
  const sanitizedPath = sanitizeUrl(request.nextUrl);
  console.log('[Middleware] Path:', sanitizedPath, '| Auth:', !!refreshToken);

  const isAuthenticated = !!refreshToken;

  // Rewrite /@username/library to /member/username/library
  const basePath = "/app";
  const normalizedPath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || "/"
    : pathname;
  if (normalizedPath.startsWith("/@")) {
    const match = normalizedPath.match(/^\/@([^/]+)(\/library(?:\/.*)?)$/);
    if (match) {
      const username = match[1];
      const rest = match[2] || "";
      const rewriteUrl = new URL(`${basePath}/member/${username}${rest}`, request.url);
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  // Rewrite /{username}/library/... to /member/{username}/library/...
  if (normalizedPath.startsWith("/") && normalizedPath.includes("/library")) {
    const match = normalizedPath.match(/^\/([^/]+)(\/library(?:\/.*)?)$/);
    if (match) {
      const username = match[1];
      const rest = match[2] || "";
      const rewriteUrl = new URL(`${basePath}/member/${username}${rest}`, request.url);
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  // Check if this is a logout redirect (bypass cookie check due to timing)
  const isLogoutRedirect = request.nextUrl.searchParams.get('logout') === 'true';

  // Define route categories
  const isAuthPage = pathname.startsWith('/app/login') ||
                     pathname.startsWith('/app/signup') ||
                     pathname.startsWith('/app/forgot-password');

  const isProtectedPage = pathname.startsWith('/app/dashboard') ||
                          pathname.startsWith('/app/settings') ||
                          pathname.startsWith('/app/admin') ||
                          pathname.startsWith('/app/profile');

  // Redirect unauthenticated users trying to access protected pages
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users trying to access auth pages
  // UNLESS this is a logout redirect (cookies being deleted, timing issue)
  if (isAuthPage && isAuthenticated && !isLogoutRedirect) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow all other requests
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 *
 * We exclude:
 * - API routes (/api/*)
 * - Static files (_next/static/*)
 * - Image optimization (_next/image/*)
 * - Favicon and other public assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (*.png, *.jpg, *.svg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

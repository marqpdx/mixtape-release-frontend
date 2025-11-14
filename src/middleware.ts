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
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for refresh token cookie
  const refreshToken = request.cookies.get('refresh_token');
  const isAuthenticated = !!refreshToken;

  // Define route categories
  const isAuthPage = pathname.startsWith('/login') ||
                     pathname.startsWith('/signup') ||
                     pathname.startsWith('/forgot-password');

  const isProtectedPage = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/settings') ||
                          pathname.startsWith('/admin') ||
                          pathname.startsWith('/profile');

  const isPublicPage = pathname === '/' ||
                       pathname.startsWith('/about') ||
                       pathname.startsWith('/contact');

  // Redirect unauthenticated users trying to access protected pages
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users trying to access auth pages
  if (isAuthPage && isAuthenticated) {
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

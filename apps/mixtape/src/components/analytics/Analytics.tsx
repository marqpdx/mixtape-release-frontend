// apps/mixtape/src/components/analytics/Analytics.tsx

"use client";

/**
 * Analytics.tsx
 *
 * Umami analytics integration component.
 * Provides automatic page view tracking and custom event tracking utilities.
 *
 * Usage:
 *   // Add to App.tsx or root layout
 *   <Analytics />
 *
 *   // Track custom events anywhere
 *   import { trackEvent } from '@/components/analytics';
 *   trackEvent('signup_completed', { plan: 'pro' });
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

// ============================================================================
// Types
// ============================================================================

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

// ============================================================================
// Configuration
// ============================================================================

const UMAMI_SRC =
  process.env.NEXT_PUBLIC_UMAMI_SRC ||
  (process.env.NEXT_PUBLIC_UMAMI_HOST
    ? `${process.env.NEXT_PUBLIC_UMAMI_HOST.replace(/\/$/, '')}/script.js`
    : '');
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || '';

// ============================================================================
// Analytics Component
// ============================================================================

/**
 * Analytics component that handles Umami script loading and page view tracking.
 *
 * Add this component once at the root of your app (e.g., in App.tsx).
 * It will:
 * - Load the Umami tracking script in production
 * - Automatically track page views on route changes
 */
export function Analytics() {
  const pathname = usePathname();

  // Track page views on route change
  useEffect(() => {
    // Umami auto-tracks page views, but this ensures SPA navigation is captured
    // The script handles this automatically, so this is optional
  }, [pathname]);

  if (!UMAMI_SRC || !UMAMI_WEBSITE_ID) {
    return null;
  }

  return (
    <Script
      id="umami-analytics"
      src={UMAMI_SRC}
      strategy="afterInteractive"
      data-website-id={UMAMI_WEBSITE_ID}
    />
  );
}

// ============================================================================
// Event Tracking Utilities
// ============================================================================

/**
 * Track a custom event in Umami.
 *
 * @param event - Event name (e.g., 'signup_completed', 'recording_uploaded')
 * @param data - Optional event data (e.g., { plan: 'pro', format: 'mkv' })
 *
 * @example
 * trackEvent('recording_uploaded', { format: 'mkv', size_mb: 150 });
 * trackEvent('transcription_started', { model: 'large-v3' });
 * trackEvent('signup_completed');
 */
export function trackEvent(event: string, data?: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(event, data);
  }
}

/**
 * Track a page view manually (usually not needed as Umami auto-tracks).
 *
 * @param url - Optional URL to track (defaults to current page)
 */
export function trackPageView(url?: string): void {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track('pageview', url ? { url } : undefined);
  }
}

// ============================================================================
// Pre-defined Event Helpers
// ============================================================================

/**
 * Common event tracking helpers for Mixtape-specific actions.
 */
export const analytics = {
  // Auth events
  signupStarted: () => trackEvent('signup_started'),
  signupCompleted: () => trackEvent('signup_completed'),
  loginCompleted: () => trackEvent('login_completed'),
  logoutCompleted: () => trackEvent('logout_completed'),

  // Recording events
  recordingUploaded: (data: { format?: string; size_mb?: number }) =>
    trackEvent('recording_uploaded', data),
  transcriptionStarted: (data: { model?: string }) =>
    trackEvent('transcription_started', data),
  transcriptionCompleted: (data: { model?: string; duration_ms?: number }) =>
    trackEvent('transcription_completed', data),

  // Group events
  groupCreated: (data?: { type?: string }) => trackEvent('group_created', data),
  groupJoined: () => trackEvent('group_joined'),

  // Content events
  documentCreated: (data?: { type?: string }) => trackEvent('document_created', data),
  documentPublished: () => trackEvent('document_published'),

  // Feature usage
  featureUsed: (feature: string, data?: Record<string, unknown>) =>
    trackEvent('feature_used', { feature, ...data }),
};

export default Analytics;

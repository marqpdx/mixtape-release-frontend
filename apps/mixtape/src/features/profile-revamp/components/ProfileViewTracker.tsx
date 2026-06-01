'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/components/analytics';

export function ProfileViewTracker({ username }: { username: string }) {
  useEffect(() => {
    trackEvent('profile_revamp.viewed', { username });
  }, [username]);
  return null;
}

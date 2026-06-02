'use client';
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useProfileDrawer } from '../stores/profileDrawerStore';
import { fetchPublicProfile } from '../api/client';
import ProfileHeader from './ProfileHeader';
import PinnedShowcase from './PinnedShowcase';
import FeaturedLinks from './FeaturedLinks';
import { THEMES } from '../lib/themes';
import { computeAccentInk } from '../lib/contrast';

function DrawerContent({ username }: { username: string }) {
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile-revamp', 'public', username],
    queryFn: () => fetchPublicProfile(username),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div style={{ padding: 24, color: 'var(--ink-soft)', fontSize: 14 }}>Loading…</div>
    );
  }
  if (isError || !profile) {
    return (
      <div style={{ padding: 24, color: 'var(--ink-soft)', fontSize: 14 }}>Could not load profile.</div>
    );
  }

  const tokens = THEMES[profile.theme ?? 'paper'].tokens;
  const accent = profile.accent ?? '#c2410c';
  const cssVars: Record<string, string> = {
    ...tokens,
    '--accent': accent,
    '--accent-ink': computeAccentInk(accent),
  };

  const pinnedSection = profile.sectionLayout?.find(s => s.id === 'pinned');
  const linksSection  = profile.sectionLayout?.find(s => s.id === 'links');

  return (
    <div
      data-theme={profile.theme ?? 'paper'}
      style={{ ...(cssVars as React.CSSProperties), display: 'flex', flexDirection: 'column', gap: 20, padding: 24, flex: 1, overflowY: 'auto' }}
    >
      <ProfileHeader profile={profile} />

      {pinnedSection?.visible && profile.pinned && (
        <PinnedShowcase pinned={profile.pinned} />
      )}

      {linksSection?.visible && profile.links && profile.links.length > 0 && (
        <FeaturedLinks links={profile.links} />
      )}

      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--rule)' }}>
        <Link
          href={`/member/handle/${username}`}
          style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
        >
          Open full profile →
        </Link>
      </div>
    </div>
  );
}

export function ProfileDrawer() {
  const { username, close } = useProfileDrawer();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!username) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [username, close]);

  if (!username) return null;

  return (
    <>
      {/* backdrop */}
      <div
        ref={overlayRef}
        onClick={close}
        style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(0,0,0,0.35)',
        }}
        aria-hidden
      />

      {/* panel */}
      <div
        role="dialog"
        aria-modal
        aria-label="Member profile"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1201,
          width: 'min(420px, 100vw)',
          background: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
          <button
            onClick={close}
            aria-label="Close profile"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#666', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <DrawerContent username={username} />
      </div>
    </>
  );
}

// Public profile — /member/handle/{username}
// RSC: fetch profile server-side, render shell. Zero client JS except <NowPlaying>.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublicProfile } from '@/features/profile-revamp/api/client';
// Profile (single-scroll) retained for editor and drawer — not used on this page.
// @deprecated-candidate: remove once ProfileTabShell is fully validated.
import { ProfileTabShell, type ProfileTabId } from '@/features/profile-revamp/components/ProfileTabShell';
import { ProfileViewTracker } from '@/features/profile-revamp/components/ProfileViewTracker';
import { ProfileBackLink } from '@/features/profile-revamp/components/ProfileBackLink';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3011';

export const revalidate = 60;

type Params = Promise<{ username: string }>;
type SearchParams = Promise<{ from?: string; tab?: string; fromLabel?: string }>;

const VALID_TABS = new Set<ProfileTabId>(['storyline', 'profile', 'writing']);

function validateFrom(raw: string | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/')) return null;
  if (raw.includes('://')) return null;
  return raw;
}

function validateTab(raw: string | undefined): ProfileTabId {
  if (raw && VALID_TABS.has(raw as ProfileTabId)) return raw as ProfileTabId;
  return 'profile';
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { username } = await params;
  try {
    const profile = await fetchPublicProfile(username);
    return {
      title: `${profile.displayName} — Mixtape`,
      description: profile.bio?.slice(0, 160) || profile.role || undefined,
      openGraph: {
        title: profile.displayName,
        description: profile.bio?.slice(0, 160) || undefined,
        url: `${SITE_URL}/member/handle/${username}`,
        type: 'profile',
        ...(profile.avatarUrl ? { images: [{ url: profile.avatarUrl }] } : {}),
      },
    };
  } catch {
    return { title: 'Member — Mixtape' };
  }
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { username } = await params;
  const { from: rawFrom, tab: rawTab, fromLabel } = await searchParams;
  const from = validateFrom(rawFrom);
  const initialTab = validateTab(rawTab);

  let profile;
  try {
    profile = await fetchPublicProfile(username);
  } catch {
    notFound();
  }
  return (
    <>
      <ProfileViewTracker username={username} />
      {from && (
        <div style={{ padding: '0.5rem 1.5rem' }}>
          <ProfileBackLink from={from} label={fromLabel} />
        </div>
      )}
      <ProfileTabShell profile={profile} initialTab={initialTab} />
    </>
  );
}

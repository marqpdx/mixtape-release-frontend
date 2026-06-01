// Public profile — /member/handle/{username}
// RSC: fetch profile server-side, render shell. Zero client JS except <NowPlaying>.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublicProfile } from '@/features/profile-revamp/api/client';
import Profile from '@/features/profile-revamp/components/Profile';
import { ProfileViewTracker } from '@/features/profile-revamp/components/ProfileViewTracker';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3011';

export const revalidate = 60;

type Params = Promise<{ username: string }>;

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

export default async function PublicProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  let profile;
  try {
    profile = await fetchPublicProfile(username);
  } catch {
    notFound();
  }
  return (
    <>
      <ProfileViewTracker username={username} />
      <Profile profile={profile} />
    </>
  );
}

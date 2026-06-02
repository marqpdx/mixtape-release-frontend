// 301 → canonical public profile per profile-revamp CR-001 AD-PR-CR-1
import { permanentRedirect } from 'next/navigation';

export default async function LegacyPublicProfileRedirect({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  permanentRedirect(`/member/handle/${username}`);
}

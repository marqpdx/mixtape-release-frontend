// @deprecated — canonical public profile is /member/handle/[username].
// This route now redirects permanently.

import { redirect } from 'next/navigation';

export default async function OldMemberProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(`/member/handle/${username}`);
}

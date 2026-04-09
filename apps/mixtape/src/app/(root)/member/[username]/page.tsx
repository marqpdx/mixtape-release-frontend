// src/app/(root)/member/[username]/page.tsx
// Public member profile — accessible without authentication.

import type { Metadata } from "next";
import MemberLandingWrapper from "./_MemberLandingWrapper";

const ROOT_API_URL = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "http://127.0.0.1:8010";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3010";

async function fetchMemberProfile(username: string) {
  try {
    const res = await fetch(`${ROOT_API_URL}/api/public/members/${username}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const member = await fetchMemberProfile(username);
  if (!member) return { title: "Member" };

  const name = member.display_name || member.username;
  const description = member.quick_intro || member.practice_area || "";
  const image = member.profile_image_url || member.avatar_url || undefined;

  return {
    title: `${name} — Crossroads`,
    description: description || undefined,
    openGraph: {
      title: name,
      description: description || undefined,
      url: `${SITE_URL}/member/${username}`,
      type: "profile",
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function PublicMemberProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <MemberLandingWrapper username={username} />;
}

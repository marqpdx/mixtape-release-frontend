// apps/crossroads/app/(main)/(site)/[slug]/page.tsx
// Server component — renders only when a published PublicPage exists for the group.
// No published page → redirect to /. SEO metadata emitted server-side.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CrossroadsPageClient from "./CrossroadsPageClient";
import type { PublicGroupDetail } from "@mixtape/api/clients/public/publicApi";

type Props = { params: Promise<{ slug: string }> };

const API_BASE =
  process.env.NEXT_PUBLIC_ROOT_API_URL ?? "http://127.0.0.1:8010";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://crossroads.mixtape.com";

async function fetchPublishedPage(slug: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/public/groups/${slug}/page`, {
    next: { revalidate: 60 },
  });
  return res.ok;
}

async function fetchGroup(slug: string): Promise<PublicGroupDetail | null> {
  const res = await fetch(`${API_BASE}/api/public/groups/${slug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json() as Promise<PublicGroupDetail>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const isPublished = await fetchPublishedPage(slug);
  if (!isPublished) return {};

  const group = await fetchGroup(slug);
  if (!group) return {};

  const description = group.quick_intro || group.description || undefined;

  return {
    title: group.title,
    description,
    openGraph: {
      title: group.title,
      description,
      url: `${SITE_URL}/${slug}`,
      type: "website",
      ...(group.profile_image_url
        ? { images: [{ url: group.profile_image_url }] }
        : {}),
    },
    alternates: {
      canonical: `${SITE_URL}/${slug}`,
    },
  };
}

export default async function CrossroadsPage({ params }: Props) {
  const { slug } = await params;

  const isPublished = await fetchPublishedPage(slug);
  if (!isPublished) redirect("/");

  const group = await fetchGroup(slug);
  if (!group) redirect("/");

  return <CrossroadsPageClient group={group} />;
}

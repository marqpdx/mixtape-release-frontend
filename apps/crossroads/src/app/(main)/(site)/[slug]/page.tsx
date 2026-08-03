// apps/crossroads/app/(main)/(site)/[slug]/page.tsx
// Server component — fetches group data for SEO metadata and initial render.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CrossroadsPageClient from "./CrossroadsPageClient";
import type { PublicGroupDetail } from "@mixtape/api/clients/public/publicApi";

type Props = { params: Promise<{ slug: string }> };

const API_BASE =
  process.env.NEXT_PUBLIC_ROOT_API_URL ?? "http://127.0.0.1:8010";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://crossroads.mixtape.com";

async function fetchGroup(slug: string): Promise<PublicGroupDetail | null> {
  const res = await fetch(`${API_BASE}/api/public/groups/${slug}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Unexpected response ${res.status} for group ${slug}`);
  return res.json() as Promise<PublicGroupDetail>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const group = await fetchGroup(slug);
  if (!group) return { title: "Group not found" };

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
  const group = await fetchGroup(slug);
  if (!group) notFound();
  return <CrossroadsPageClient group={group} />;
}

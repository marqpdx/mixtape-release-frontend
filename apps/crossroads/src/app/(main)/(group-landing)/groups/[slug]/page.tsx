// src/app/(main)/(group-landing)/groups/[slug]/page.tsx
//
// Public Group landing page — server component.
// T1: synthesized from Group data (background image + name + latest writing).
// T2: full config with hero/featured/about/engagement, AI-assembled rows.
// Decision 11: no Crossroads chrome. Group is the tenant; this is their front door.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { GroupPublicLandingConfig } from "./types";
import { GroupPublicHero } from "./sections/GroupPublicHero";
import { GroupPublicFeatured } from "./sections/GroupPublicFeatured";
import { GroupPublicAbout } from "./sections/GroupPublicAbout";
import { GroupPublicEngagement } from "./sections/GroupPublicEngagement";
import { GroupPublicFooter } from "./sections/GroupPublicFooter";
import { GroupPublicT1 } from "./sections/GroupPublicT1";

async function fetchGroupConfig(slug: string): Promise<GroupPublicLandingConfig | null> {
  const baseUrl = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "";
  try {
    const res = await fetch(`${baseUrl}/api/public/groups/${slug}/public-config`, {
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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = await fetchGroupConfig(slug);
  if (!config) return { title: "Group" };
  const description =
    (config.hero?.body || config.about.text || config.group.summary) || undefined;
  return {
    title: config.group.title,
    description,
    openGraph: {
      title: config.hero?.headline || config.group.title,
      description,
      images: config.group.background_image_url
        ? [{ url: config.group.background_image_url }]
        : config.group.profile_image_url
        ? [{ url: config.group.profile_image_url }]
        : undefined,
    },
  };
}

export default async function GroupPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await fetchGroupConfig(slug);
  if (!config) notFound();

  // T1: no active config — render lean surface from Group data
  if (config.tier === "t1") {
    return (
      <main className="gpl-root">
        <GroupPublicT1 config={config} groupSlug={slug} />
        <GroupPublicFooter groupTitle={config.group.title} />
      </main>
    );
  }

  // T2: active config with hero/sections
  const hasFeatured = config.featured_content.pieces.length > 0;
  const hasAbout = !!(config.about.text || config.about.descriptors.length);
  const hasEngagement = !!(
    config.engagement.text ||
    config.engagement.capability_pills.length ||
    config.engagement.cta.label
  );

  return (
    <main className="gpl-root">
      <GroupPublicHero config={config} hasFeatured={hasFeatured} />

      {hasFeatured && (
        <GroupPublicFeatured
          pieces={config.featured_content.pieces}
          layout={config.featured_content.layout}
          groupSlug={slug}
        />
      )}

      {hasAbout && <GroupPublicAbout about={config.about} />}

      {(hasEngagement || config.subscription.has_list) && (
        <GroupPublicEngagement
          engagement={config.engagement}
          subscription={config.subscription}
          groupSlug={slug}
        />
      )}

      <GroupPublicFooter groupTitle={config.group.title} />
    </main>
  );
}

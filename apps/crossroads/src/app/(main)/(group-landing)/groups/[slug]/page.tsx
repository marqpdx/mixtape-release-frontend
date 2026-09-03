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
import { GroupPublicMasthead } from "./sections/GroupPublicMasthead";
import { GroupPublicLedger } from "./sections/GroupPublicLedger";
import { GroupPublicAtlas } from "./sections/GroupPublicAtlas";
import { GroupPublicAdminBar } from "./sections/GroupPublicAdminBar";

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
    (config.hero?.body || config.about.text || config.group.tagline || config.group.summary) || undefined;
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

  const adminBar = (
    <GroupPublicAdminBar
      groupSlug={slug}
      groupTitle={config.group.title}
      initialPresentation={config.presentation ?? null}
    />
  );

  // T1: synthesized payload — always Masthead
  if (config.tier === "t1") {
    return (
      <main className="gpl-root">
        {adminBar}
        <GroupPublicMasthead config={config} groupSlug={slug} />
        <GroupPublicFooter groupTitle={config.group.title} />
      </main>
    );
  }

  // T2: route on template_id; default to Masthead when unset or unrecognised
  const templateId = config.presentation?.template_id ?? null;

  if (templateId === "ledger") {
    return (
      <main className="gpl-root">
        {adminBar}
        <GroupPublicLedger config={config} groupSlug={slug} />
        <GroupPublicFooter groupTitle={config.group.title} />
      </main>
    );
  }

  if (templateId === "masthead" || templateId === null) {
    return (
      <main className="gpl-root">
        {adminBar}
        <GroupPublicMasthead config={config} groupSlug={slug} />
        <GroupPublicFooter groupTitle={config.group.title} />
      </main>
    );
  }

  // Atlas — full-bleed 3:1 banner; falls back to Masthead when no banner image
  if (templateId === "atlas") {
    if (config.group.background_image_url) {
      return (
        <main className="gpl-root">
          {adminBar}
          <GroupPublicAtlas config={config} groupSlug={slug} />
          <GroupPublicFooter groupTitle={config.group.title} />
        </main>
      );
    }
    return (
      <main className="gpl-root">
        {adminBar}
        <GroupPublicMasthead config={config} groupSlug={slug} />
        <GroupPublicFooter groupTitle={config.group.title} />
      </main>
    );
  }

  // Docket — deferred; fall back to Masthead
  if (templateId === "docket") {
    return (
      <main className="gpl-root">
        {adminBar}
        <GroupPublicMasthead config={config} groupSlug={slug} />
        <GroupPublicFooter groupTitle={config.group.title} />
      </main>
    );
  }

  // Legacy T2 hero/sections path (pre-tier system)
  const hasFeatured = config.featured_content.pieces.length > 0;
  const hasAbout = !!(config.about.text || config.about.descriptors.length);
  const hasEngagement = !!(
    config.engagement.text ||
    config.engagement.capability_pills.length ||
    config.engagement.cta.label
  );

  return (
    <main className="gpl-root">
      {adminBar}
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

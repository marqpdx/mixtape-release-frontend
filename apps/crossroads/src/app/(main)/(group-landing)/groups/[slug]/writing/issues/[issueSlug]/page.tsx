import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PublicGroupIssue, PublicLibraryPiece } from "@mixtape/api/clients/public/publicApi";
import { GroupPublicNav } from "../../../sections/GroupPublicNav";
import { GroupPublicFooter } from "../../../sections/GroupPublicFooter";
import { IssueReader } from "./IssueReader";
import type { GroupPublicLandingConfig } from "../../../types";
import { tenantPalettes } from "../../../tenantPalettes";

const baseUrl = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3010";

async function fetchIssue(groupSlug: string, issueSlug: string): Promise<PublicGroupIssue | null> {
  try {
    const res = await fetch(`${baseUrl}/api/public/groups/${groupSlug}/writing/issues/${issueSlug}`, {
      next: { revalidate: 60 },
    });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

async function fetchConfig(slug: string): Promise<GroupPublicLandingConfig | null> {
  try {
    const res = await fetch(`${baseUrl}/api/public/groups/${slug}/public-config`, {
      next: { revalidate: 60 },
    });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

async function fetchWriting(groupSlug: string): Promise<PublicLibraryPiece[]> {
  try {
    const res = await fetch(`${baseUrl}/api/public/groups/${groupSlug}/writing`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    // Reading-time metadata is optional; keep the continuous reader available.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; issueSlug: string }>;
}): Promise<Metadata> {
  const { slug, issueSlug } = await params;
  const issue = await fetchIssue(slug, issueSlug);
  if (!issue) return { title: "Issue not found" };
  const url = `${siteUrl}/groups/${slug}/writing/issues/${issueSlug}`;
  const description = issue.pieces[0]?.excerpt || `${issue.piece_count} pieces in ${issue.title}`;
  return {
    title: issue.title,
    description,
    openGraph: { title: issue.title, description, url, type: "article" },
    alternates: { canonical: url },
  };
}

export default async function PublicGroupIssuePage({
  params,
}: {
  params: Promise<{ slug: string; issueSlug: string }>;
}) {
  const { slug, issueSlug } = await params;
  const [issue, config, writing] = await Promise.all([
    fetchIssue(slug, issueSlug), fetchConfig(slug), fetchWriting(slug),
  ]);
  if (!issue || !config) notFound();

  const palette = tenantPalettes.find((item) => item.id === config.presentation?.palette_id);
  const paletteStyle = (selector: string, c: (typeof tenantPalettes)[number]["light"] | undefined) => c ? `${selector} {
    --theme-bg: ${c.bg}; --theme-bg-secondary: ${c.bgSecondary ?? c.bg};
    --theme-bg-subtle: color-mix(in srgb, ${c.bg} 60%, ${c.border} 40%);
    --theme-surface: ${c.surface}; --theme-text: ${c.text}; --theme-text-secondary: ${c.textSecondary};
    --theme-text-muted: color-mix(in srgb, ${c.text} 45%, ${c.bg} 55%);
    --theme-text-faint: color-mix(in srgb, ${c.text} 22%, ${c.bg} 78%);
    --theme-border: ${c.border}; --theme-accent: ${c.accent};
    --theme-accent-soft: color-mix(in srgb, ${c.accent} 12%, ${c.bg} 88%);
  }` : "";

  return (
    <main className="gwir-root" style={{ background: "var(--theme-bg)", color: "var(--theme-text)", minHeight: "100vh" }}>
      <style>{`
        ${paletteStyle(".gwir-root", palette?.light)}
        ${paletteStyle(".dark .gwir-root", palette?.dark)}
        ${paletteStyle(".high-contrast .gwir-root, [data-high-contrast] .gwir-root", palette?.lightHighContrast)}
        ${paletteStyle(".dark.high-contrast .gwir-root, .dark [data-high-contrast] .gwir-root", palette?.darkHighContrast)}
      `}</style>
      <GroupPublicNav groupSlug={slug} groupTitle={config.group.title} active="writing" />
      <IssueReader issue={issue} groupSlug={slug} groupTitle={config.group.title} writing={writing} />
      <GroupPublicFooter groupTitle={config.group.title} />
    </main>
  );
}

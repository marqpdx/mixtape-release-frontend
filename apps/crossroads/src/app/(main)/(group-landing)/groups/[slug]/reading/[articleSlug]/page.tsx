// (group-landing)/groups/[slug]/reading/[articleSlug]/page.tsx
//
// Public WritingPiece reader. Server component for SSR + metadata.
// No platform chrome (Decision 11). Back link → sponsoring group when known.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import type { PublicWritingPiece } from "@mixtape/api/clients/public/publicApi";
import { PieceBody } from "./PieceBody";
import { GroupPublicFooter } from "../../sections/GroupPublicFooter";
import { GroupPublicNav } from "../../sections/GroupPublicNav";
import type { GroupPublicLandingConfig, TypographySetting } from "../../types";
import { tenantPalettes } from "../../tenantPalettes";

const baseUrl = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3010";
type GroupPublicWritingPiece = PublicWritingPiece & { public_synopsis?: string };

const TYP = {
  journal: {
    measure: "81ch",
    titleSize: "3.5rem",
    titleWeight: "400",
    titleTracking: "-0.01em",
    titleLh: "1.12",
    bodySize: "1.188rem",
    bodyLh: "1.32",
    standfirstSize: "1.5rem",
    hairline: "0.5px",
  },
  notice: {
    measure: "62ch",
    titleSize: "2.75rem",
    titleWeight: "600",
    titleTracking: "-0.022em",
    titleLh: "1.1",
    bodySize: "1.063rem",
    bodyLh: "1.28",
    standfirstSize: "1.25rem",
    hairline: "1px",
  },
} as const;

function paletteCSS(selector: string, c: {
  bg: string;
  bgSecondary?: string;
  surface: string;
  accent: string;
  text: string;
  textSecondary: string;
  border: string;
}): string {
  return `${selector} {
  --theme-bg: ${c.bg};
  --theme-bg-secondary: ${c.bgSecondary ?? c.bg};
  --theme-bg-subtle: color-mix(in srgb, ${c.bg} 60%, ${c.border} 40%);
  --theme-surface: ${c.surface};
  --theme-accent: ${c.accent};
  --theme-accent-soft: color-mix(in srgb, ${c.accent} 12%, ${c.bg} 88%);
  --theme-text: ${c.text};
  --theme-text-secondary: ${c.textSecondary};
  --theme-text-muted: color-mix(in srgb, ${c.text} 45%, ${c.bg} 55%);
  --theme-text-faint: color-mix(in srgb, ${c.text} 22%, ${c.bg} 78%);
  --theme-border: ${c.border};
}`;
}

async function fetchPiece(groupSlug: string, articleSlug: string): Promise<GroupPublicWritingPiece | null> {
  try {
    const res = await fetch(`${baseUrl}/api/public/groups/${groupSlug}/writing/${articleSlug}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchGroupConfig(slug: string): Promise<GroupPublicLandingConfig | null> {
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
  params: Promise<{ slug: string; articleSlug: string }>;
}): Promise<Metadata> {
  const { slug, articleSlug } = await params;
  const piece = await fetchPiece(slug, articleSlug);
  if (!piece) return { title: "Writing" };
  const groupConfig = piece.sponsor_group
    ? await fetchGroupConfig(piece.sponsor_group.slug)
    : null;
  const url = `${siteUrl}/groups/${slug}/reading/${articleSlug}`;
  const description = piece.public_synopsis || piece.excerpt || undefined;
  const image = groupConfig?.group.background_image_url || groupConfig?.group.profile_image_url || undefined;
  return {
    title: piece.title,
    description,
    openGraph: {
      title: piece.title,
      description,
      url,
      type: "article",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: piece.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: { canonical: url },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function paletteOverrides(config: GroupPublicLandingConfig | null): string {
  const paletteId = config?.presentation?.palette_id ?? null;
  const tenantPalette = paletteId
    ? (tenantPalettes.find((p) => p.id === paletteId) ?? null)
    : null;
  if (!tenantPalette) return "";
  return [
    paletteCSS(".gpr-root", tenantPalette.light),
    paletteCSS(".dark .gpr-root", tenantPalette.dark),
    tenantPalette.lightHighContrast
      ? paletteCSS(".high-contrast .gpr-root, [data-high-contrast] .gpr-root", tenantPalette.lightHighContrast)
      : "",
    tenantPalette.darkHighContrast
      ? paletteCSS(".dark.high-contrast .gpr-root, .dark [data-high-contrast] .gpr-root", tenantPalette.darkHighContrast)
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default async function PublicPieceReaderPage({
  params,
}: {
  params: Promise<{ slug: string; articleSlug: string }>;
}) {
  const { slug, articleSlug } = await params;
  const piece = await fetchPiece(slug, articleSlug);
  if (!piece) notFound();

  const groupConfig = piece.sponsor_group
    ? await fetchGroupConfig(piece.sponsor_group.slug)
    : null;
  const setting: TypographySetting = groupConfig?.presentation?.typography_setting ?? "journal";
  const typ = TYP[setting];
  const colStyles: CSSProperties = {
    maxWidth: typ.measure,
    margin: "0 auto",
    padding: "0 16px",
  };

  const backHref = piece.sponsor_group
    ? `/groups/${piece.sponsor_group.slug}/writing`
    : `/members/${piece.author.username}`;
  const backLabel = piece.sponsor_group
    ? `← ${piece.sponsor_group.title}`
    : `← ${piece.author.display_name}`;

  const footerTitle = piece.sponsor_group?.title ?? piece.author.display_name;

  return (
    <main className="gpr-root" style={{ background: "var(--theme-bg)", color: "var(--theme-text)" }}>
      <style>{`
        .gpr-back { text-underline-offset: 3px; }
        .gpr-body {
          color: var(--theme-text);
          font-size: ${typ.bodySize};
          line-height: ${typ.bodyLh};
        }
        .gpr-body p:not(.ttr-code-paragraph) { margin: 0 0 1.25em; }
        .gpr-body p.ttr-code-paragraph { margin: 0; }
        .gpr-body h2, .gpr-body h3 {
          color: var(--theme-text);
          line-height: 1.22;
          margin: 2em 0 0.75em;
        }
        .gpr-body h2 { font-size: ${setting === "journal" ? "1.875rem" : "1.625rem"}; }
        .gpr-body h3 { font-size: ${setting === "journal" ? "1.5rem" : "1.313rem"}; }
        .gpr-body a { color: var(--theme-text); text-decoration-color: var(--theme-accent); text-underline-offset: 3px; }
        ${paletteOverrides(groupConfig)}
      `}</style>
      {piece.sponsor_group && (
        <GroupPublicNav
          groupSlug={piece.sponsor_group.slug}
          groupTitle={piece.sponsor_group.title}
          active="reading"
        />
      )}

      <article className="gpr-content" style={{ ...colStyles, paddingTop: "32px", paddingBottom: "72px" }}>
        <header className="gpr-header" style={{ borderBottom: "2px solid var(--theme-accent)", paddingBottom: "32px" }}>
          <Link
            href={backHref}
            className="gpr-back"
            style={{
              color: "var(--theme-text-muted)",
              fontSize: "0.875rem",
              fontWeight: "500",
              textDecoration: "underline",
              textDecorationColor: "var(--theme-accent)",
              textDecorationThickness: "2px",
            }}
          >
            {backLabel}
          </Link>

          <h1
            style={{
              fontSize: typ.titleSize,
              fontWeight: typ.titleWeight,
              letterSpacing: typ.titleTracking,
              lineHeight: typ.titleLh,
              color: "var(--theme-text)",
              margin: "16px 0 0",
            }}
          >
            {piece.title}
          </h1>

          <p
            className="gpr-meta"
            style={{
              color: "var(--theme-text-muted)",
              fontSize: "0.875rem",
              margin: "16px 0 0",
            }}
          >
            {piece.author.display_name}
          {piece.published_at && (
            <>
                {" · "}
                {formatDate(piece.published_at)}
            </>
          )}
          {piece.writing_kind && (
            <>
                {" · "}
                {piece.writing_kind.replace(/_/g, " ")}
            </>
          )}
          </p>

          {piece.excerpt && (
            <p
              style={{
                color: "var(--theme-text-secondary)",
                fontSize: typ.standfirstSize,
                lineHeight: typ.bodyLh,
                margin: "32px 0 0",
              }}
            >
              {piece.excerpt}
            </p>
          )}
        </header>

        <div className="gpr-body" style={{ marginTop: "72px" }}>
          {piece.body_json && <PieceBody body_json={piece.body_json} />}
        </div>
      </article>

      <GroupPublicFooter groupTitle={footerTitle} />
    </main>
  );
}

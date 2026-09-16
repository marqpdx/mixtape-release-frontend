// (group-landing)/groups/[slug]/writing/page.tsx
//
// Group writing index — all published WritingPieces for this Group.
// Server component. No platform chrome (Decision 11).

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import type { PublicLibraryPiece } from "@mixtape/api/clients/public/publicApi";
import { GroupPublicFooter } from "../sections/GroupPublicFooter";
import type { GroupPublicLandingConfig, TypographySetting } from "../types";
import { tenantPalettes } from "../tenantPalettes";

const baseUrl = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3010";

const TYP = {
  journal: {
    measure: "68ch",
    titleSize: "3.5rem",
    titleWeight: "400",
    titleTracking: "-0.01em",
    titleLh: "1.12",
    bodySize: "1.188rem",
    bodyLh: "1.65",
    leadSize: "2.813rem",
    hairline: "0.5px",
  },
  notice: {
    measure: "62ch",
    titleSize: "2.75rem",
    titleWeight: "600",
    titleTracking: "-0.022em",
    titleLh: "1.1",
    bodySize: "1.063rem",
    bodyLh: "1.6",
    leadSize: "2.313rem",
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

async function fetchWriting(slug: string): Promise<PublicLibraryPiece[]> {
  try {
    const res = await fetch(`${baseUrl}/api/public/groups/${slug}/writing`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = await fetchGroupConfig(slug);
  if (!config) return { title: "Writing" };
  const { group } = config;
  const description = group.summary || undefined;
  const url = `${siteUrl}/groups/${slug}/writing`;
  const image = group.background_image_url || group.profile_image_url || undefined;
  return {
    title: `Writing — ${group.title}`,
    description,
    openGraph: {
      title: `Writing — ${group.title}`,
      description,
      url,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `Writing — ${group.title}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: { canonical: url },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function byline(piece: PublicLibraryPiece): string {
  const parts: string[] = [piece.author.display_name];
  if (piece.published_at) parts.push(formatDate(piece.published_at));
  if (piece.reading_time) parts.push(`${piece.reading_time} min read`);
  return parts.join(" · ");
}

function paletteOverrides(config: GroupPublicLandingConfig): string {
  const paletteId = config.presentation?.palette_id ?? null;
  const tenantPalette = paletteId
    ? (tenantPalettes.find((p) => p.id === paletteId) ?? null)
    : null;
  if (!tenantPalette) return "";
  return [
    paletteCSS(".gwi-root", tenantPalette.light),
    paletteCSS(".dark .gwi-root", tenantPalette.dark),
    tenantPalette.lightHighContrast
      ? paletteCSS(".high-contrast .gwi-root, [data-high-contrast] .gwi-root", tenantPalette.lightHighContrast)
      : "",
    tenantPalette.darkHighContrast
      ? paletteCSS(".dark.high-contrast .gwi-root, .dark [data-high-contrast] .gwi-root", tenantPalette.darkHighContrast)
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default async function GroupWritingIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [config, pieces] = await Promise.all([fetchGroupConfig(slug), fetchWriting(slug)]);
  if (!config) notFound();

  const { group } = config;
  const setting: TypographySetting = config.presentation?.typography_setting ?? "journal";
  const typ = TYP[setting];
  const colStyles: CSSProperties = {
    maxWidth: typ.measure,
    margin: "0 auto",
    padding: "0 16px",
  };

  return (
    <main className="gwi-root" style={{ background: "var(--theme-bg)", color: "var(--theme-text)" }}>
      <style>{`
        .gwi-piece-link { text-decoration: none; display: block; }
        .gwi-piece-link:hover .gwi-piece-title { color: var(--theme-accent); }
        .gwi-piece-title { transition: color var(--transition-duration, 200ms) ease; }
        .gwi-back { text-underline-offset: 3px; }
        ${paletteOverrides(config)}
      `}</style>

      <section className="gwi-header" style={{ ...colStyles, paddingTop: "72px" }}>
        <div style={{ borderBottom: "2px solid var(--theme-accent)", paddingBottom: "32px" }}>
          <Link
            href={`/groups/${slug}`}
            className="gwi-back"
            style={{
              color: "var(--theme-text-muted)",
              fontSize: "0.875rem",
              fontWeight: "500",
              textDecoration: "underline",
              textDecorationColor: "var(--theme-accent)",
              textDecorationThickness: "2px",
            }}
          >
            ← {group.title}
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
            Writing
          </h1>
          {group.summary && (
            <p
              style={{
                color: "var(--theme-text-secondary)",
                fontSize: typ.bodySize,
                lineHeight: typ.bodyLh,
                margin: "8px 0 0",
              }}
            >
              {group.summary}
            </p>
          )}
        </div>
      </section>

      <section className="gwi-list" style={{ ...colStyles, marginTop: "72px", paddingBottom: "72px" }}>
        {pieces.length === 0 ? (
          null
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {pieces.map((piece) => (
              <li
                key={piece.id}
                className="gwi-piece"
                style={{ borderTop: `${typ.hairline} solid var(--theme-border)` }}
              >
                <Link href={`/reading/${piece.slug}`} className="gwi-piece-link" style={{ padding: "16px 0" }}>
                  <h2
                    className="gwi-piece-title"
                    style={{
                      color: "var(--theme-text)",
                      fontSize: typ.leadSize,
                      fontWeight: typ.titleWeight,
                      lineHeight: setting === "journal" ? "1.2" : "1.15",
                      margin: 0,
                    }}
                  >
                    {piece.title}
                  </h2>
                  {piece.excerpt && (
                    <p
                      style={{
                        color: "var(--theme-text-secondary)",
                        fontSize: typ.bodySize,
                        lineHeight: typ.bodyLh,
                        margin: "8px 0 0",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {piece.excerpt}
                    </p>
                  )}
                  <p
                    style={{
                      color: "var(--theme-text-muted)",
                      fontSize: "0.875rem",
                      margin: "8px 0 0",
                    }}
                  >
                    {byline(piece)}
                  </p>
                </Link>
              </li>
            ))}
            <li style={{ borderTop: `${typ.hairline} solid var(--theme-border)` }} aria-hidden />
          </ul>
        )}
      </section>

      <GroupPublicFooter groupTitle={group.title} />
    </main>
  );
}

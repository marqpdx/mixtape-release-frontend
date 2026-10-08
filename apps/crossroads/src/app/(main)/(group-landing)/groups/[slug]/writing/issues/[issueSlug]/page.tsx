import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import type { PublicGroupIssue } from "@mixtape/api/clients/public/publicApi";
import { GroupPublicNav } from "../../../sections/GroupPublicNav";
import { GroupPublicFooter } from "../../../sections/GroupPublicFooter";
import { PieceBody } from "../../../reading/[articleSlug]/PieceBody";
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
  searchParams,
}: {
  params: Promise<{ slug: string; issueSlug: string }>;
  searchParams: Promise<{ piece?: string }>;
}) {
  const { slug, issueSlug } = await params;
  const { piece: selectedPiece } = await searchParams;
  const [issue, config] = await Promise.all([fetchIssue(slug, issueSlug), fetchConfig(slug)]);
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
        .gwir-piece summary { cursor: pointer; list-style: none; }
        .gwir-piece summary::-webkit-details-marker { display: none; }
        .gwir-piece summary::after { content: "+"; float: right; color: var(--theme-accent); }
        .gwir-piece[open] summary::after { content: "−"; }
      `}</style>
      <header className="gwir-header" style={{ maxWidth: "100ch", margin: "0 auto", padding: "32px 16px 28px" }}>
        <Link href={`/groups/${slug}`} style={{ color: "var(--theme-text)", textDecoration: "none", fontSize: "1.5rem" }}>
          {config.group.title}
        </Link>
      </header>
      <GroupPublicNav groupSlug={slug} groupTitle={config.group.title} active="writing" />
      <article className="gwir-issue" style={{ maxWidth: "81ch", margin: "0 auto", padding: "44px 16px 88px" }}>
        <Link href={`/groups/${slug}/writing`} style={{ color: "var(--theme-accent)", textUnderlineOffset: "3px" }}>
          ← Writing
        </Link>
        {issue.designation && <p style={{ color: "var(--theme-text-muted)", margin: "32px 0 4px" }}>{issue.designation}</p>}
        <h1 style={{ fontSize: "2.75rem", lineHeight: 1.12, fontWeight: 500, margin: "16px 0 8px" }}>{issue.title}</h1>
        <p style={{ color: "var(--theme-text-muted)", margin: 0 }}>
          {issue.piece_count} {issue.piece_count === 1 ? "piece" : "pieces"}
        </p>
        {issue.description && (
          <div className="gwir-introduction" style={{ margin: "36px 0 48px", color: "var(--theme-text-secondary)" }}>
            <PieceBody body_json={issue.description} />
          </div>
        )}
        <section className="gwir-contents" aria-label="Issue contents" style={{ marginTop: "48px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 16px" }}>Contents</h2>
          {issue.pieces.map((piece, index) => (
            <details
              key={piece.id}
              id={`piece-${piece.slug}`}
              className="gwir-piece"
              open={selectedPiece === piece.slug}
              style={{ borderTop: "1px solid var(--theme-border)", padding: "18px 0" }}
            >
              <summary style={{ fontSize: "1.4rem", lineHeight: 1.25, paddingRight: "24px" }}>
                <span style={{ color: "var(--theme-text-muted)", fontSize: "0.85rem", marginRight: "16px" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                {piece.title}
              </summary>
              <div className="gwir-piece-content" style={{ margin: "24px 0 8px 36px" }}>
                <p style={{ color: "var(--theme-text-muted)", fontSize: "0.875rem" }}>{piece.author}</p>
                {piece.body_json && <PieceBody body_json={piece.body_json} />}
                <Link href={`/groups/${slug}/reading/${piece.slug}`} style={{ color: "var(--theme-accent)", display: "inline-block", marginTop: "20px" }}>
                  Read this piece separately →
                </Link>
              </div>
            </details>
          ))}
        </section>
      </article>
      <GroupPublicFooter groupTitle={config.group.title} />
    </main>
  );
}

// GroupPublicLedger — Tier 2 "Ledger" template.
// Two-column asymmetric: left rail (≈34%) sticky identity block; right column scrolling content.
// Inherits the same six constraints and zone language as Masthead.
// Server component — plain HTML + CSS custom properties; no client component boundary.

import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import type { GroupPublicLandingConfig, FeaturedPiece, TypographySetting } from "../types";
import { TYP, paletteCSS, resolveFont } from "../typography";
import { MastheadSubscribeForm } from "./MastheadSubscribeForm";
import { tenantPalettes } from "../tenantPalettes";

interface Props {
  config: GroupPublicLandingConfig;
  groupSlug: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function byline(piece: FeaturedPiece): string {
  const parts: string[] = [piece.author.display_name];
  if (piece.reading_time) parts.push(`${piece.reading_time} min`);
  if (piece.published_at) parts.push(formatDate(piece.published_at));
  return parts.join(" · ");
}

export function GroupPublicLedger({ config, groupSlug }: Props) {
  const { group, featured_content, about, engagement, subscription } = config;
  const setting: TypographySetting = config.presentation?.typography_setting ?? "journal";
  const typ = TYP[setting];
  const { fontClass, displayExtraClass, displayTitleFamily } = resolveFont(
    setting,
    config.presentation?.font_id
  );

  // Tenant palette — scoped to .gplr-root
  const paletteId = config.presentation?.palette_id ?? null;
  const tenantPalette = paletteId
    ? (tenantPalettes.find((p) => p.id === paletteId) ?? null)
    : null;
  const tenantPaletteCSS = tenantPalette
    ? [
        paletteCSS(".gplr-root", tenantPalette.light),
        paletteCSS(".dark .gplr-root", tenantPalette.dark),
        tenantPalette.lightHighContrast
          ? paletteCSS(".high-contrast .gplr-root, [data-high-contrast] .gplr-root", tenantPalette.lightHighContrast)
          : "",
        tenantPalette.darkHighContrast
          ? paletteCSS(".dark.high-contrast .gplr-root, .dark [data-high-contrast] .gplr-root", tenantPalette.darkHighContrast)
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const deck = group.tagline || group.summary || null;
  const hasBanner = !!group.background_image_url;
  const hasStandfirst = !!(about.text || about.descriptors.length);
  const pieces = featured_content.pieces;
  const hasPieces = pieces.length > 0;
  const hasClosing = !!(
    engagement.text ||
    engagement.capability_pills.length ||
    engagement.cta.label ||
    subscription.has_list
  );

  const ctaStyle: React.CSSProperties = setting === "journal"
    ? {
        color: "var(--theme-text)",
        textDecoration: "underline",
        textDecorationColor: "var(--theme-accent)",
        textDecorationThickness: "2px",
        fontSize: typ.bodySize,
        fontWeight: "600",
        fontFamily: "inherit",
      }
    : {
        display: "inline-block",
        padding: "10px 20px",
        background: "var(--theme-accent)",
        color: "var(--theme-bg)",
        fontSize: typ.bodySize,
        fontWeight: "600",
        textDecoration: "none",
        borderRadius: "0",
        fontFamily: "inherit",
      };

  return (
    <>
      <style>{`
        .gplr-piece-link:hover .gplr-piece-title { color: var(--theme-accent); }
        .gplr-piece-link { text-decoration: none; display: block; }
        .gplr-piece-title { transition: color var(--transition-duration, 200ms) ease; }
        .gplr-all-writing { text-underline-offset: 3px; }
        @media (max-width: 720px) {
          .gplr-layout { flex-direction: column !important; }
          .gplr-rail { position: static !important; border-right: none !important; border-bottom: 1px solid var(--theme-border); width: 100% !important; max-height: none !important; }
          .gplr-content { width: 100% !important; }
        }
        ${tenantPaletteCSS}
      `}</style>

      <div
        className={`gplr-root ${fontClass}${displayExtraClass ? ` ${displayExtraClass}` : ""}`}
        style={{ background: "var(--theme-bg)", color: "var(--theme-text)" }}
      >
        <div
          className="gplr-layout"
          style={{
            display: "flex",
            alignItems: "flex-start",
            minHeight: "100vh",
          }}
        >
          {/* ── Left rail ──────────────────────────────────────────── */}
          <aside
            className="gplr-rail"
            style={{
              width: "34%",
              flexShrink: 0,
              position: "sticky",
              top: 0,
              maxHeight: "100vh",
              overflowY: "auto",
              borderRight: `1px solid var(--theme-border)`,
              padding: "48px 32px",
              boxSizing: "border-box",
            }}
          >
            {/* Profile mark */}
            {group.profile_image_url && (
              <div style={{
                width: "56px",
                height: "56px",
                overflow: "hidden",
                marginBottom: "24px",
                flexShrink: 0,
              }}>
                <Image
                  src={group.profile_image_url}
                  alt={group.title}
                  width={56}
                  height={56}
                  unoptimized
                  style={{ objectFit: "cover", display: "block" }}
                />
              </div>
            )}

            {/* Title */}
            <h1
              className="gplr-title"
              style={{
                fontSize: typ.titleSize,
                fontWeight: typ.titleWeight,
                letterSpacing: typ.titleTracking,
                lineHeight: typ.titleLh,
                color: "var(--theme-text)",
                margin: 0,
                ...(displayTitleFamily ? { fontFamily: displayTitleFamily } : {}),
              }}
            >
              {group.title}
            </h1>

            {/* Deck */}
            {deck && (
              <p style={{
                color: "var(--theme-text-secondary)",
                fontSize: typ.bodySize,
                lineHeight: typ.bodyLh,
                marginTop: "12px",
                marginBottom: 0,
                // Spec: clamp rail at 8 lines for long summaries
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 8,
                WebkitBoxOrient: "vertical",
              }}>
                {deck}
              </p>
            )}

            {/* Descriptors */}
            {about.descriptors.length > 0 && (
              <div style={{
                borderTop: `${typ.hairline} solid var(--theme-border)`,
                marginTop: "16px",
                paddingTop: "7px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}>
                {about.descriptors.map((d, i) => (
                  <span key={i} style={{
                    color: "var(--theme-text-muted)",
                    fontVariant: typ.sectionLabel.fontVariant,
                    fontWeight: typ.sectionLabel.fontWeight,
                    letterSpacing: typ.sectionLabel.letterSpacing,
                    fontSize: typ.sectionLabel.fontSize,
                    textTransform: typ.sectionLabel.textTransform,
                  }}>
                    {d}
                  </span>
                ))}
              </div>
            )}

            {/* Accent rule — one of the three accent uses */}
            <div style={{ height: "2px", background: "var(--theme-accent)", marginTop: "24px" }} />

            {/* Primary CTA */}
            {engagement.cta.label && (
              <div style={{ marginTop: "24px" }}>
                <Link href={engagement.cta.action || "#"} style={ctaStyle}>
                  {engagement.cta.label}
                </Link>
              </div>
            )}

            {/* Subscribe — in rail when no closing zone */}
            {!hasClosing && subscription.has_list && subscription.list_slug && (
              <div style={{ marginTop: "24px" }}>
                <MastheadSubscribeForm
                  listSlug={subscription.list_slug}
                  setting={setting}
                />
              </div>
            )}
          </aside>

          {/* ── Right column ───────────────────────────────────────── */}
          <div
            className="gplr-content"
            style={{ flex: 1, minWidth: 0, padding: "48px 40px 72px" }}
          >
            {/* Banner — 3:1, contained to right column width */}
            {hasBanner && (
              <div style={{ position: "relative", aspectRatio: "3/1", overflow: "hidden", marginBottom: "40px", background: "var(--theme-bg-subtle)" }}>
                {/* Signed Stash URLs bypass the Next optimizer to avoid cache-key churn. */}
                <Image
                  src={group.background_image_url!}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 100vw, 66vw"
                  priority
                  unoptimized
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}

            {/* Standfirst */}
            {hasStandfirst && about.text && (
              <p style={{
                color: "var(--theme-text-secondary)",
                fontSize: typ.standfirstSize,
                lineHeight: typ.bodyLh,
                margin: `0 0 40px`,
              }}>
                {about.text}
              </p>
            )}

            {/* Writing zone */}
            {hasPieces && (
              <section className="gplr-zone-writing">
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "16px",
                }}>
                  <span style={{
                    color: "var(--theme-text-muted)",
                    fontVariant: typ.sectionLabel.fontVariant,
                    fontWeight: typ.sectionLabel.fontWeight,
                    letterSpacing: typ.sectionLabel.letterSpacing,
                    fontSize: typ.sectionLabel.fontSize,
                    textTransform: typ.sectionLabel.textTransform,
                  }}>
                    Writing
                  </span>
                  {/* Second accent use — "All writing →" underline */}
                  <Link
                    href={`/groups/${groupSlug}/writing`}
                    className="gplr-all-writing"
                    style={{
                      color: "var(--theme-text)",
                      fontSize: typ.bodySize,
                      fontWeight: "500",
                      textDecoration: "underline",
                      textDecorationColor: "var(--theme-accent)",
                      textDecorationThickness: "2px",
                    }}
                  >
                    All writing →
                  </Link>
                </div>

                {/* Piece list — hairline rows, no cards, no lead enlargement */}
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {pieces.map((piece) => (
                    <li
                      key={piece.id}
                      className="gplr-piece-item"
                      style={{ borderTop: `${typ.hairline} solid var(--theme-border)` }}
                    >
                      <Link href={`/groups/${groupSlug}/reading/${piece.slug}`} className="gplr-piece-link" style={{ padding: "14px 0" }}>
                        <span
                          className="gplr-piece-title"
                          style={{
                            display: "block",
                            color: "var(--theme-text)",
                            fontSize: typ.bodySize,
                            fontWeight: "600",
                            lineHeight: typ.bodyLh,
                          }}
                        >
                          {piece.title}
                        </span>
                        {piece.excerpt && (
                          <span style={{
                            display: "-webkit-box",
                            color: "var(--theme-text-secondary)",
                            fontSize: "0.875rem",
                            lineHeight: "1.5",
                            marginTop: "2px",
                            overflow: "hidden",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                          } as React.CSSProperties}>
                            {piece.excerpt}
                          </span>
                        )}
                        <span style={{
                          display: "block",
                          color: "var(--theme-text-muted)",
                          fontSize: "0.875rem",
                          marginTop: "4px",
                        }}>
                          {byline(piece)}
                        </span>
                      </Link>
                    </li>
                  ))}
                  <li style={{ borderTop: `${typ.hairline} solid var(--theme-border)` }} aria-hidden />
                </ul>
              </section>
            )}

            {/* Closing — engagement text + subscribe when present */}
            {hasClosing && (
              <section style={{ marginTop: "48px" }}>
                <div style={{ background: "var(--theme-surface)", padding: "32px" }}>
                  {engagement.text && (
                    <p style={{
                      color: "var(--theme-text)",
                      fontSize: typ.bodySize,
                      lineHeight: typ.bodyLh,
                      margin: 0,
                    }}>
                      {engagement.text}
                    </p>
                  )}

                  {engagement.capability_pills.length > 0 && (
                    <p style={{
                      color: "var(--theme-text-muted)",
                      fontSize: "0.875rem",
                      marginTop: "8px",
                      marginBottom: 0,
                    }}>
                      {engagement.capability_pills.join(", ")}
                    </p>
                  )}

                  {subscription.has_list && subscription.list_slug && (
                    <div style={{ marginTop: "16px" }}>
                      <MastheadSubscribeForm
                        listSlug={subscription.list_slug}
                        setting={setting}
                      />
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

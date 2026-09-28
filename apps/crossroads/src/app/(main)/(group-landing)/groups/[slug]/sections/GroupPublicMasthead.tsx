// GroupPublicMasthead — Tier 1 surface.
// Single centred column, measure-governed, four zones (Masthead / Standfirst / Writing / Closing).
// Server component — plain HTML + CSS custom properties; no client component boundary.
// Six constraints from the spec are enforced via comments where relevant.

import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import type { GroupPublicLandingConfig, FeaturedPiece, TypographySetting } from "../types";
import { TYP, paletteCSS, resolveFont } from "../typography";
import { GroupPublicNav } from "./GroupPublicNav";
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

export function GroupPublicMasthead({ config, groupSlug }: Props) {
  const { group, featured_content, about, engagement, subscription } = config;
  const setting: TypographySetting = config.presentation?.typography_setting ?? "journal";
  const typ = TYP[setting];
  const { fontClass, displayExtraClass, displayTitleFamily } = resolveFont(
    setting,
    config.presentation?.font_id
  );

  // Tenant palette — present only when presentation.palette_id is set (Tier 2+).
  // Scoped to .gplm-root so visitor's platform theme choice doesn't bleed in.
  // .dark class is set synchronously by next-themes, so dark-mode overrides work at load.
  const paletteId = config.presentation?.palette_id ?? null;
  const tenantPalette = paletteId
    ? (tenantPalettes.find((p) => p.id === paletteId) ?? null)
    : null;
  const tenantPaletteCSS = tenantPalette
    ? [
        paletteCSS(".gplm-root", tenantPalette.light),
        paletteCSS(".dark .gplm-root", tenantPalette.dark),
        tenantPalette.lightHighContrast
          ? paletteCSS(".high-contrast .gplm-root, [data-high-contrast] .gplm-root", tenantPalette.lightHighContrast)
          : "",
        tenantPalette.darkHighContrast
          ? paletteCSS(".dark.high-contrast .gplm-root, .dark [data-high-contrast] .gplm-root", tenantPalette.darkHighContrast)
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const deck = group.summary || null;
  const standfirst = group.description || about.text;
  const hasBanner = !!group.background_image_url;
  const hasStandfirst = !!(standfirst || about.descriptors.length);
  const pieces = featured_content.pieces.slice(0, 3);
  const hasPieces = pieces.length > 0;
  const leadPiece = pieces[0] ?? null;
  const listPieces = pieces.slice(1);
  const hasClosing = !!(
    engagement.text ||
    engagement.capability_pills.length ||
    engagement.cta.label ||
    subscription.has_list
  );

  // CTA is Journal: text + 2px accent underrule. Notice: filled rect, 0 radius.
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

  const colStyles: React.CSSProperties = {
    maxWidth: typ.measure,
    margin: "0 auto",
    padding: "0 16px",
  };

  return (
    <>
      {/* Scoped hover rules + optional tenant palette overrides */}
      <style>{`
        .gplm-lead-link:hover .gplm-lead-title { color: var(--theme-accent); }
        .gplm-piece-link:hover .gplm-piece-title { color: var(--theme-accent); }
        .gplm-lead-link, .gplm-piece-link { text-decoration: none; display: block; }
        .gplm-lead-title, .gplm-piece-title {
          transition: color var(--transition-duration, 200ms) ease;
        }
        .gplm-all-writing { text-underline-offset: 3px; }
        @media (max-width: 767px) {
          .gplm-zone-masthead { padding-top: 20px !important; }
        }
        ${tenantPaletteCSS}
      `}</style>

      <div
        className={`gplm-root ${fontClass}${displayExtraClass ? ` ${displayExtraClass}` : ""}`}
        style={{ background: "var(--theme-bg)", color: "var(--theme-text)" }}
      >
        {/* ── Zone 1: Masthead ─────────────────────────────────── */}
        <section
          className="gplm-zone-masthead"
          style={{ ...colStyles, paddingTop: "20px" }}
        >
          {hasBanner && (
            <div className="gplm-banner-wrap" style={{ position: "relative", marginBottom: "48px" }}>
              <div
                className="gplm-banner-frame"
                style={{
                  position: "relative",
                  aspectRatio: "25/9",
                  overflow: "hidden",
                  background: "var(--theme-bg-subtle)",
                }}
              >
                {/* Signed Stash URLs bypass the Next optimizer to avoid cache-key churn. */}
                <Image
                  src={group.background_image_url!}
                  alt=""
                  fill
                  sizes="100vw"
                  priority
                  unoptimized
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div
                className="gplm-mark"
                style={{
                  position: "absolute",
                  bottom: "-36px",
                  left: "24px",
                  width: "72px",
                  height: "72px",
                  border: "3px solid var(--theme-bg)",
                  overflow: "hidden",
                  background: group.profile_image_url ? undefined : "var(--theme-accent-soft)",
                  flexShrink: 0,
                }}
                >
                {group.profile_image_url ? (
                  <Image
                    src={group.profile_image_url}
                    alt={group.title}
                    width={72}
                    height={72}
                    unoptimized
                    style={{ objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "72px", height: "72px" }}>
                    <span style={{
                      color: "var(--theme-accent)",
                      fontSize: "1.75rem",
                      fontWeight: setting === "journal" ? "400" : "600",
                      fontVariant: setting === "journal" ? "small-caps" : undefined,
                    }}>
                      {group.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <h1
            className="gplm-title"
            style={{
              fontSize: "2.75rem",
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

          {deck && (
            <p
              className="gplm-deck"
              style={{
                color: "var(--theme-text-secondary)",
                fontSize: typ.bodySize,
                lineHeight: typ.bodyLh,
                marginTop: "8px",
                marginBottom: 0,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {deck}
            </p>
          )}

          <div style={{ height: "2px", background: "var(--theme-accent)", marginTop: "32px" }} />
        </section>

        <GroupPublicNav
          groupSlug={groupSlug}
          groupTitle={group.title}
          active="home"
          recentTargetId="recent"
        />

        {/* ── Zone 2: Standfirst ───────────────────────────────── */}
        {hasStandfirst && (
          <section
            className="gplm-zone-standfirst"
            style={{ ...colStyles, marginTop: "72px" }}
          >
            {standfirst && (
              <p style={{
                color: "var(--theme-text-secondary)",
                fontSize: "1.35rem",
                lineHeight: 1.5,
                margin: 0,
                borderLeft: "2px solid var(--theme-text-secondary)",
                paddingLeft: "10px",
              }}>
                {standfirst}
              </p>
            )}

            {about.descriptors.length > 0 && (
              <div style={{
                borderTop: `${typ.hairline} solid var(--theme-border)`,
                marginTop: standfirst ? "16px" : "0",
                paddingTop: "7px",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                alignItems: "center",
              }}>
                {about.descriptors.map((d, i) => (
                  <Fragment key={i}>
                    {i > 0 && <span aria-hidden style={{ color: "var(--theme-border)" }}>·</span>}
                    <span style={{
                      color: "var(--theme-text-muted)",
                      fontVariant: typ.sectionLabel.fontVariant,
                      fontWeight: typ.sectionLabel.fontWeight,
                      letterSpacing: typ.sectionLabel.letterSpacing,
                      fontSize: typ.sectionLabel.fontSize,
                      textTransform: typ.sectionLabel.textTransform,
                    }}>
                      {d}
                    </span>
                  </Fragment>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Zone 3: Writing ──────────────────────────────────── */}
        {hasPieces && (
          <section
            className="gplm-zone-writing"
            style={{ ...colStyles, marginTop: "48px", paddingBottom: hasClosing ? 0 : "72px" }}
          >
            {/* Section header */}
            <div
              id="recent"
              style={{ marginBottom: "32px" }}
            >
              <span style={{
                color: "var(--theme-text-muted)",
                fontVariant: typ.sectionLabel.fontVariant,
                fontWeight: typ.sectionLabel.fontWeight,
                letterSpacing: typ.sectionLabel.letterSpacing,
                fontSize: typ.sectionLabel.fontSize,
                textTransform: typ.sectionLabel.textTransform,
              }}>
                Recent
              </span>
            </div>

            {/* Lead piece — display size, excerpt, byline */}
            {leadPiece && (
              <div className="gplm-lead" style={{ marginBottom: listPieces.length ? "32px" : "0" }}>
                <Link href={`/groups/${groupSlug}/reading/${leadPiece.slug}`} className="gplm-lead-link">
                  <h2
                    className="gplm-lead-title"
                    style={{
                      fontSize: "2rem",
                      fontWeight: typ.titleWeight,
                      lineHeight: setting === "journal" ? "1.2" : "1.15",
                      color: "var(--theme-text)",
                      margin: 0,
                      ...(displayTitleFamily ? { fontFamily: displayTitleFamily } : {}),
                    }}
                  >
                    {leadPiece.title}
                  </h2>
                </Link>
                <p style={{
                  color: "var(--theme-text-muted)",
                  fontSize: "0.875rem",
                  marginTop: "8px",
                  marginBottom: 0,
                }}>
                  {byline(leadPiece)}
                </p>
                {leadPiece.excerpt && (
                  <p style={{
                    color: "var(--theme-text-secondary)",
                    fontSize: typ.bodySize,
                    lineHeight: typ.bodyLh,
                    marginTop: "8px",
                    marginBottom: 0,
                  }}>
                    {leadPiece.excerpt.slice(0, 80).trimEnd()}…{" "}
                    <Link
                      href={`/groups/${groupSlug}/reading/${leadPiece.slug}`}
                      className="gplm-read-more"
                      style={{
                        color: "var(--theme-text)",
                        fontWeight: "600",
                        textDecoration: "underline",
                        textDecorationColor: "var(--theme-accent)",
                        textUnderlineOffset: "3px",
                      }}
                    >
                      Read more
                    </Link>
                  </p>
                )}
              </div>
            )}

            {/* Piece list — constraint 3: hairline rows, no cards, no radius */}
            {listPieces.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {listPieces.map((piece) => (
                  <li
                    key={piece.id}
                    className="gplm-piece-item"
                    style={{ borderTop: `${typ.hairline} solid var(--theme-border)` }}
                  >
                    <Link href={`/groups/${groupSlug}/reading/${piece.slug}`} className="gplm-piece-link" style={{ padding: "12px 0" }}>
                      <span
                        className="gplm-piece-title"
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
              </ul>
            )}

            <div style={{ marginTop: "24px", textAlign: "right" }}>
              <Link
                href={`/groups/${groupSlug}/writing`}
                className="gplm-all-writing"
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
          </section>
        )}

        {/* ── Zone 4: Closing ──────────────────────────────────── */}
        {hasClosing && (
          <section
            className="gplm-zone-closing"
            style={{ ...colStyles, marginTop: "72px", paddingBottom: "72px" }}
          >
            {/* Set on --theme-surface, inset to measure */}
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

              {/* Primary CTA — accent appears here (constraint 4, 2nd use) */}
              {engagement.cta.label && (
                <div style={{ marginTop: "16px" }}>
                  <Link href={engagement.cta.action || "#"} style={ctaStyle}>
                    {engagement.cta.label}
                  </Link>
                </div>
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
    </>
  );
}

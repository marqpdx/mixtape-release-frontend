// GroupPublicMasthead — Tier 1 surface.
// Single centred column, measure-governed, four zones (Masthead / Standfirst / Writing / Closing).
// Server component — plain HTML + CSS custom properties; no Chakra.
// Six constraints from the spec are enforced via comments where relevant.

import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import type { GroupPublicLandingConfig, FeaturedPiece, TypographySetting } from "../types";
import { journalFont, noticeFont } from "../fonts";
import { MastheadSubscribeForm } from "./MastheadSubscribeForm";

interface Props {
  config: GroupPublicLandingConfig;
  groupSlug: string;
}

// rem values derived from spec px at 16px root:
// Journal title 56px = 3.5rem, body 19px = 1.188rem, lead (45px) = 2.813rem, standfirst (24px) = 1.5rem
// Notice title 44px = 2.75rem, body 17px = 1.063rem, lead (37px) = 2.313rem, standfirst (20px) = 1.25rem
const TYP = {
  journal: {
    measure: "68ch",
    fontFamily: "inherit", // applied via className on root
    titleSize: "3.5rem",
    titleWeight: "400",
    titleTracking: "-0.01em",
    titleLh: "1.12",
    bodySize: "1.188rem",
    bodyLh: "1.65",
    leadSize: "2.813rem",
    standfirstSize: "1.5rem",
    hairline: "0.5px",
    sectionLabel: {
      fontVariant: "small-caps" as const,
      fontWeight: "400" as const,
      letterSpacing: "0.14em",
      fontSize: "1.188rem",
      textTransform: undefined as undefined,
    },
  },
  notice: {
    measure: "62ch",
    fontFamily: "inherit",
    titleSize: "2.75rem",
    titleWeight: "600",
    titleTracking: "-0.022em",
    titleLh: "1.1",
    bodySize: "1.063rem",
    bodyLh: "1.6",
    leadSize: "2.313rem",
    standfirstSize: "1.25rem",
    hairline: "1px",
    sectionLabel: {
      fontVariant: undefined as undefined,
      fontWeight: "600" as const,
      letterSpacing: "0.14em",
      fontSize: "0.688rem",
      textTransform: "uppercase" as const,
    },
  },
} as const;

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
  const fontClass = setting === "journal" ? journalFont.className : noticeFont.className;

  const deck = group.tagline || group.summary || null;
  const hasBanner = !!group.background_image_url;
  const hasStandfirst = !!(about.text || about.descriptors.length);
  const pieces = featured_content.pieces;
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
      {/* Scoped hover rules — no new CSS variables, uses existing tokens */}
      <style>{`
        .gplm-lead-link:hover .gplm-lead-title { color: var(--theme-accent); }
        .gplm-piece-link:hover .gplm-piece-title { color: var(--theme-accent); }
        .gplm-lead-link, .gplm-piece-link { text-decoration: none; display: block; }
        .gplm-lead-title, .gplm-piece-title {
          transition: color var(--transition-duration, 200ms) ease;
        }
        .gplm-all-writing { text-underline-offset: 3px; }
      `}</style>

      <div
        className={`gplm-root ${fontClass}`}
        style={{ background: "var(--theme-bg)", color: "var(--theme-text)" }}
      >
        {/* ── Zone 1: Masthead ─────────────────────────────────── */}
        <section className="gplm-zone-masthead" style={{ ...colStyles, paddingTop: "72px" }}>

          {/* Banner — constraint 1: width = measure, never full-bleed */}
          {hasBanner && (
            <div className="gplm-banner-wrap" style={{ position: "relative", marginBottom: "48px" }}>
              {/* constraint 2: no text over imagery */}
              <div style={{ position: "relative", aspectRatio: "21/9", overflow: "hidden", background: "var(--theme-bg-subtle)" }}>
                <Image
                  src={group.background_image_url!}
                  alt=""
                  fill
                  priority
                  sizes={`(min-width: 1200px) ${typ.measure}, 100vw`}
                  style={{ objectFit: "cover" }}
                />
              </div>

              {/* Profile mark — 72×72px, bottom edge of banner, 24px from left */}
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
                    style={{ objectFit: "cover", width: "72px", height: "72px" }}
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
              fontSize: typ.titleSize,
              fontWeight: typ.titleWeight,
              letterSpacing: typ.titleTracking,
              lineHeight: typ.titleLh,
              color: "var(--theme-text)",
              margin: 0,
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

          {/* Closing rule — accent appears once here (constraint 4) */}
          <div style={{ height: "2px", background: "var(--theme-accent)", marginTop: "32px" }} />
        </section>

        {/* ── Zone 2: Standfirst ───────────────────────────────── */}
        {hasStandfirst && (
          <section
            className="gplm-zone-standfirst"
            style={{ ...colStyles, marginTop: "72px" }}
          >
            {about.text && (
              <p style={{
                color: "var(--theme-text-secondary)",
                fontSize: typ.standfirstSize,
                lineHeight: typ.bodyLh,
                margin: 0,
              }}>
                {about.text}
              </p>
            )}

            {about.descriptors.length > 0 && (
              <div style={{
                borderTop: `${typ.hairline} solid var(--theme-border)`,
                marginTop: about.text ? "16px" : "0",
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
            style={{ ...colStyles, marginTop: "72px" }}
          >
            {/* Section header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "32px" }}>
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
              {/* accent underline — third and final accent use (constraint 4) */}
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

            {/* Lead piece — display size, excerpt, byline */}
            {leadPiece && (
              <div className="gplm-lead" style={{ marginBottom: listPieces.length ? "32px" : "0" }}>
                <Link href={`/reading/${leadPiece.slug}`} className="gplm-lead-link">
                  <h2
                    className="gplm-lead-title"
                    style={{
                      fontSize: typ.leadSize,
                      fontWeight: typ.titleWeight,
                      lineHeight: setting === "journal" ? "1.2" : "1.15",
                      color: "var(--theme-text)",
                      margin: 0,
                    }}
                  >
                    {leadPiece.title}
                  </h2>
                  {leadPiece.excerpt && (
                    <p style={{
                      color: "var(--theme-text-secondary)",
                      fontSize: typ.bodySize,
                      lineHeight: typ.bodyLh,
                      marginTop: "8px",
                      marginBottom: 0,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>
                      {leadPiece.excerpt}
                    </p>
                  )}
                  <p style={{
                    color: "var(--theme-text-muted)",
                    fontSize: "0.875rem",
                    marginTop: "8px",
                    marginBottom: 0,
                  }}>
                    {byline(leadPiece)}
                  </p>
                </Link>
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
                    <Link href={`/reading/${piece.slug}`} className="gplm-piece-link" style={{ padding: "12px 0" }}>
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
                <li style={{ borderTop: `${typ.hairline} solid var(--theme-border)` }} aria-hidden />
              </ul>
            )}
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

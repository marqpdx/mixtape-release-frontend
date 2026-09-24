// GroupPublicAtlas — Tier 2 "Atlas" template.
// Full-bleed 3:1 banner; identity block below banner; 2-up alternating mosaic piece grid.
// Falls back to Masthead in page.tsx when group.background_image_url is absent.

import Link from "next/link";
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

export function GroupPublicAtlas({ config, groupSlug }: Props) {
  const { group, featured_content, about, engagement, subscription } = config;
  const setting: TypographySetting = config.presentation?.typography_setting ?? "journal";
  const typ = TYP[setting];
  const { fontClass, displayExtraClass, displayTitleFamily } = resolveFont(
    setting,
    config.presentation?.font_id
  );

  // Tenant palette — scoped to .gpla-root
  const paletteId = config.presentation?.palette_id ?? null;
  const tenantPalette = paletteId
    ? (tenantPalettes.find((p) => p.id === paletteId) ?? null)
    : null;
  const tenantPaletteCSS = tenantPalette
    ? [
        paletteCSS(".gpla-root", tenantPalette.light),
        paletteCSS(".dark .gpla-root", tenantPalette.dark),
        tenantPalette.lightHighContrast
          ? paletteCSS(".high-contrast .gpla-root, [data-high-contrast] .gpla-root", tenantPalette.lightHighContrast)
          : "",
        tenantPalette.darkHighContrast
          ? paletteCSS(".dark.high-contrast .gpla-root, .dark [data-high-contrast] .gpla-root", tenantPalette.darkHighContrast)
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const deck = group.tagline || group.summary || null;
  const pieces = featured_content.pieces;
  const hasPieces = pieces.length > 0;
  const hasClosing = !!(
    engagement.text ||
    engagement.capability_pills.length ||
    engagement.cta.label ||
    subscription.has_list
  );

  // Group pieces into pairs for the 2-up mosaic
  const pieceRows: [FeaturedPiece, FeaturedPiece | null][] = [];
  for (let i = 0; i < pieces.length; i += 2) {
    pieceRows.push([pieces[i], pieces[i + 1] ?? null]);
  }

  const ctaStyle: React.CSSProperties =
    setting === "journal"
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

  const tileTitleStyle = (isHighlight: boolean): React.CSSProperties => ({
    display: "block",
    color: "var(--theme-text)",
    // Highlighted tile uses standfirst size; standard tile uses body size
    fontSize: isHighlight ? typ.standfirstSize : typ.bodySize,
    fontWeight: isHighlight ? typ.titleWeight : "600",
    lineHeight: typ.titleLh,
    letterSpacing: typ.titleTracking,
    marginBottom: "8px",
    ...(displayTitleFamily ? { fontFamily: displayTitleFamily } : {}),
  });

  return (
    <>
      <style>{`
        .gpla-piece-link:hover .gpla-piece-title { color: var(--theme-accent); }
        .gpla-piece-link { text-decoration: none; display: block; height: 100%; }
        .gpla-piece-title { transition: color var(--transition-duration, 200ms) ease; }
        .gpla-all-writing { text-underline-offset: 3px; }
        @media (max-width: 720px) {
          .gpla-identity { padding: 32px 24px 0 !important; }
          .gpla-mosaic-row { flex-direction: column !important; }
          .gpla-mosaic-tile { width: 100% !important; border-right: none !important; border-top: 1px solid var(--theme-border); }
          .gpla-zone-header { padding: 12px 24px !important; }
          .gpla-closing { padding: 32px 24px !important; }
        }
        ${tenantPaletteCSS}
      `}</style>

      <div
        className={`gpla-root ${fontClass}${displayExtraClass ? ` ${displayExtraClass}` : ""}`}
        style={{ background: "var(--theme-bg)", color: "var(--theme-text)" }}
      >
        {/* Full-bleed banner — 3:1, no measure constraint */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "3/1",
            overflow: "hidden",
            background: "var(--theme-bg-secondary)",
          }}
        >
          {/* Stash-backed URLs are signed, so use a plain image to avoid
              next/image cache-key churn while preserving server rendering. */}
          <img
            src={group.background_image_url!}
            alt=""
            style={{ objectFit: "cover", width: "100%", height: "100%", display: "block" }}
          />
        </div>

        {/* Identity block — below banner, full-width */}
        <div
          className="gpla-identity"
          style={{
            padding: "48px 48px 0",
            borderBottom: `${typ.hairline} solid var(--theme-border)`,
          }}
        >
          {/* Mark + title inline */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            {group.profile_image_url && (
              <div style={{ width: "56px", height: "56px", overflow: "hidden", flexShrink: 0 }}>
                <img
                  src={group.profile_image_url}
                  alt={group.title}
                  width={56}
                  height={56}
                  style={{ objectFit: "cover", width: "56px", height: "56px" }}
                />
              </div>
            )}
            <h1
              className="gpla-title"
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
          </div>

          {/* Deck */}
          {deck && (
            <p
              style={{
                color: "var(--theme-text-secondary)",
                fontSize: typ.standfirstSize,
                lineHeight: typ.bodyLh,
                margin: "0 0 16px",
                maxWidth: "80ch",
              }}
            >
              {deck}
            </p>
          )}

          {/* Descriptors */}
          {about.descriptors.length > 0 && (
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
              {about.descriptors.map((d, i) => (
                <span
                  key={i}
                  style={{
                    color: "var(--theme-text-muted)",
                    fontVariant: typ.sectionLabel.fontVariant,
                    fontWeight: typ.sectionLabel.fontWeight,
                    letterSpacing: typ.sectionLabel.letterSpacing,
                    fontSize: typ.sectionLabel.fontSize,
                    textTransform: typ.sectionLabel.textTransform,
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          )}

          {/* Accent rule — one of the three accent uses */}
          <div style={{ height: "2px", background: "var(--theme-accent)", marginBottom: "24px" }} />

          {/* CTA row + subscribe when no closing zone */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              alignItems: "center",
              marginBottom: "32px",
              flexWrap: "wrap",
            }}
          >
            {engagement.cta.label && (
              <Link href={engagement.cta.action || "#"} style={ctaStyle}>
                {engagement.cta.label}
              </Link>
            )}
            {!hasClosing && subscription.has_list && subscription.list_slug && (
              <MastheadSubscribeForm listSlug={subscription.list_slug} setting={setting} />
            )}
          </div>
        </div>

        {/* Writing zone — 2-up alternating mosaic */}
        {hasPieces && (
          <section className="gpla-zone-writing">
            {/* Zone header */}
            <div
              className="gpla-zone-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "16px 48px",
                borderBottom: `${typ.hairline} solid var(--theme-border)`,
              }}
            >
              <span
                style={{
                  color: "var(--theme-text-muted)",
                  fontVariant: typ.sectionLabel.fontVariant,
                  fontWeight: typ.sectionLabel.fontWeight,
                  letterSpacing: typ.sectionLabel.letterSpacing,
                  fontSize: typ.sectionLabel.fontSize,
                  textTransform: typ.sectionLabel.textTransform,
                }}
              >
                Writing
              </span>
              {/* Second accent use — "All writing →" underline */}
              <Link
                href={`/groups/${groupSlug}/writing`}
                className="gpla-all-writing"
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

            {/* Mosaic rows — 2-up, surface alternates sides each row */}
            {pieceRows.map(([left, right], rowIdx) => {
              const isEvenRow = rowIdx % 2 === 0;
              return (
                <div
                  key={left.id}
                  className="gpla-mosaic-row"
                  style={{
                    display: "flex",
                    borderBottom: `${typ.hairline} solid var(--theme-border)`,
                  }}
                >
                  {/* Left tile — highlighted on even rows */}
                  <div
                    className="gpla-mosaic-tile"
                    style={{
                      flex: 1,
                      borderRight: `${typ.hairline} solid var(--theme-border)`,
                      background: isEvenRow ? "var(--theme-surface)" : undefined,
                    }}
                  >
                    <Link href={`/groups/${groupSlug}/reading/${left.slug}`} className="gpla-piece-link" style={{ padding: "32px" }}>
                      <span className="gpla-piece-title" style={tileTitleStyle(isEvenRow)}>
                        {left.title}
                      </span>
                      {left.excerpt && (
                        <span
                          style={
                            {
                              display: "-webkit-box",
                              overflow: "hidden",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              color: "var(--theme-text-secondary)",
                              fontSize: typ.bodySize,
                              lineHeight: typ.bodyLh,
                              marginBottom: "8px",
                            } as React.CSSProperties
                          }
                        >
                          {left.excerpt}
                        </span>
                      )}
                      <span style={{ display: "block", color: "var(--theme-text-muted)", fontSize: "0.875rem" }}>
                        {byline(left)}
                      </span>
                    </Link>
                  </div>

                  {/* Right tile — highlighted on odd rows */}
                  {right ? (
                    <div
                      className="gpla-mosaic-tile"
                      style={{
                        flex: 1,
                        background: !isEvenRow ? "var(--theme-surface)" : undefined,
                      }}
                    >
                      <Link href={`/groups/${groupSlug}/reading/${right.slug}`} className="gpla-piece-link" style={{ padding: "32px" }}>
                        <span className="gpla-piece-title" style={tileTitleStyle(!isEvenRow)}>
                          {right.title}
                        </span>
                        {right.excerpt && (
                          <span
                            style={
                              {
                                display: "-webkit-box",
                                overflow: "hidden",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                color: "var(--theme-text-secondary)",
                                fontSize: typ.bodySize,
                                lineHeight: typ.bodyLh,
                                marginBottom: "8px",
                              } as React.CSSProperties
                            }
                          >
                            {right.excerpt}
                          </span>
                        )}
                        <span style={{ display: "block", color: "var(--theme-text-muted)", fontSize: "0.875rem" }}>
                          {byline(right)}
                        </span>
                      </Link>
                    </div>
                  ) : (
                    // Odd piece count — fill right slot with empty surface tile
                    <div
                      className="gpla-mosaic-tile"
                      style={{ flex: 1, background: "var(--theme-bg-subtle)" }}
                      aria-hidden
                    />
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Standfirst (about.text) — after mosaic, before closing */}
        {about.text && (
          <div
            style={{
              padding: "48px",
              borderBottom: `${typ.hairline} solid var(--theme-border)`,
            }}
          >
            <p
              style={{
                color: "var(--theme-text-secondary)",
                fontSize: typ.standfirstSize,
                lineHeight: typ.bodyLh,
                margin: 0,
                maxWidth: "80ch",
              }}
            >
              {about.text}
            </p>
          </div>
        )}

        {/* Closing zone */}
        {hasClosing && (
          <section className="gpla-closing" style={{ padding: "48px" }}>
            <div style={{ background: "var(--theme-surface)", padding: "32px" }}>
              {engagement.text && (
                <p
                  style={{
                    color: "var(--theme-text)",
                    fontSize: typ.bodySize,
                    lineHeight: typ.bodyLh,
                    margin: 0,
                  }}
                >
                  {engagement.text}
                </p>
              )}
              {engagement.capability_pills.length > 0 && (
                <p
                  style={{
                    color: "var(--theme-text-muted)",
                    fontSize: "0.875rem",
                    marginTop: "8px",
                    marginBottom: 0,
                  }}
                >
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
    </>
  );
}

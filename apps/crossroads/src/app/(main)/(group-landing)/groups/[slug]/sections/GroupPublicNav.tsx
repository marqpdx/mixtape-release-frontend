"use client";

// GroupPublicNav — tenant-local public navigation.
// This is not Crossroads platform chrome. It gives visitors local movement
// within a Group presence plus reader controls that do not override tenant palette.

import Link from "next/link";
import { useTheme, type FontScale } from "@mixtape/core";
import { SurfaceTransitionLink } from "../../../SurfaceTransition";

interface Props {
  groupSlug: string;
  groupTitle: string;
  active: "home" | "writing" | "reading";
  recentTargetId?: string;
}

const fontScales: { label: string; value: FontScale }[] = [
  { label: "S", value: 0.875 },
  { label: "M", value: 1 },
  { label: "L", value: 1.125 },
  { label: "XL", value: 1.25 },
];

export function GroupPublicNav({ groupSlug, groupTitle, active, recentTargetId }: Props) {
  const theme = useTheme();
  const colorMode = theme?.colorMode ?? "light";
  const contrastMode = theme?.contrastMode ?? "normal";
  const fontScale = theme?.fontScale ?? 1;

  const linkStyle = (key: Props["active"]): React.CSSProperties => ({
    color: "var(--theme-text)",
    textDecoration: active === key ? "underline" : "none",
    textDecorationColor: "var(--theme-accent)",
    textDecorationThickness: "2px",
    textUnderlineOffset: "4px",
    opacity: active === key ? 1 : 0.72,
    fontSize: "0.875rem",
    fontWeight: active === key ? 650 : 500,
  });

  const buttonStyle = (selected = false): React.CSSProperties => ({
    appearance: "none",
    border: `1px solid ${selected ? "var(--theme-accent)" : "var(--theme-border)"}`,
    background: selected ? "var(--theme-accent-soft)" : "transparent",
    color: "var(--theme-text)",
    padding: "4px 8px",
    minWidth: "32px",
    minHeight: "30px",
    cursor: "pointer",
    font: "inherit",
    fontSize: "0.75rem",
    fontWeight: selected ? 700 : 500,
  });

  return (
    <nav
      className="gpn-root"
      aria-label={`${groupTitle} public navigation`}
      style={{
        background: "var(--theme-bg)",
        color: "var(--theme-text)",
        borderBottom: "1px solid var(--theme-border)",
      }}
    >
      <div
        className="gpn-inner"
        style={{
          maxWidth: "100ch",
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div
          className="gpn-primary"
          style={{ display: "flex", alignItems: "baseline", gap: "16px", flexWrap: "wrap" }}
        >
          <SurfaceTransitionLink href={`/groups/${groupSlug}`} style={linkStyle("home")}>
            Home
          </SurfaceTransitionLink>
          <Link
            href={recentTargetId ? `#${recentTargetId}` : `/groups/${groupSlug}#recent`}
            style={linkStyle("reading")}
            onClick={
              recentTargetId
                ? (event) => {
                    event.preventDefault();
                    document
                      .getElementById(recentTargetId)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                : undefined
            }
          >
            Recent
          </Link>
          <SurfaceTransitionLink
            href={`/groups/${groupSlug}/writing`}
            style={linkStyle("writing")}
          >
            Writing
          </SurfaceTransitionLink>
        </div>

        <div
          className="gpn-reader-controls"
          aria-label="Reader display controls"
          style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}
        >
          <button
            type="button"
            style={buttonStyle(false)}
            onClick={() => theme?.toggleColorMode()}
            aria-label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
          >
            {colorMode === "light" ? "Dark" : "Light"}
          </button>
          <button
            type="button"
            style={buttonStyle(contrastMode === "high")}
            onClick={() => theme?.setContrastMode(contrastMode === "high" ? "normal" : "high")}
            aria-pressed={contrastMode === "high"}
          >
            Contrast
          </button>
          <div
            className="gpn-font-scale"
            role="group"
            aria-label="Text size"
            style={{ display: "flex", alignItems: "center", gap: "4px" }}
          >
            {fontScales.map((scale) => (
              <button
                key={scale.value}
                type="button"
                style={buttonStyle(fontScale === scale.value)}
                onClick={() => theme?.setFontScale(scale.value)}
                aria-pressed={fontScale === scale.value}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

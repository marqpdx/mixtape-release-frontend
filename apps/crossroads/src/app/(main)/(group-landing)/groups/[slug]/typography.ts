// Shared typographic constants and CSS helpers for Group Presence templates.
// All templates (Masthead, Ledger, Atlas) use the same TYP values for a given
// typography_setting so the experience is consistent across template switches.

import type { ThemeColors } from "@mixtape/core";
import type { TypographySetting } from "./types";
import { journalFont, noticeFont, tenantFontMap } from "./fonts";
import type { TenantFont } from "./fonts";

// rem values derived from spec px at 16px root:
// Journal title 56px = 3.5rem, body 19px = 1.188rem, lead 45px = 2.813rem, standfirst 24px = 1.5rem
// Notice title 44px = 2.75rem, body 17px = 1.063rem, lead 37px = 2.313rem, standfirst 20px = 1.25rem
export const TYP = {
  journal: {
    measure: "100ch",
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
    measure: "100ch",
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

// Generates scoped CSS custom property overrides for a tenant palette.
// Mirrors the derived vars in ThemeProvider (color-mix is safe in all evergreen browsers).
export function paletteCSS(selector: string, c: ThemeColors): string {
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

export interface ResolvedFont {
  fontClass: string;
  displayExtraClass: string;
  displayTitleFamily: string | undefined;
}

export function resolveFont(
  setting: TypographySetting,
  fontId: string | null | undefined
): ResolvedFont {
  const tenantFont: TenantFont | null = fontId ? (tenantFontMap[fontId] ?? null) : null;
  return {
    fontClass: tenantFont?.className ?? (setting === "journal" ? journalFont.className : noticeFont.className),
    displayExtraClass: tenantFont?.displayClassName ?? "",
    displayTitleFamily: tenantFont?.displayFamily ?? undefined,
  };
}

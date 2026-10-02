// Tier 1 defaults + Tier 2 tenant font shortlist (ten faces per spec).
// Keep instances at module top-level so Next can emit the font CSS.
// tenantFontMap keys are the canonical font_id values stored in presentation.font_id.
//
// Instrument Serif is display-only (spec: titles only, body stays Public Sans).
// Its entry carries a displayClassName so the Masthead can apply it narrowly to
// title elements while the root keeps Public Sans for body text.

import localFont from "next/font/local";

// Tier 1 defaults (also in tenantFontMap below)
export const journalFont = localFont({
  src: [
    { path: "../../../../../fonts/sourceserif4/latin-normal.woff2", weight: "400 600", style: "normal" },
    { path: "../../../../../fonts/sourceserif4/latin-italic.woff2", weight: "400 600", style: "italic" },
  ],
  display: "swap",
});

export const noticeFont = localFont({
  src: [
    { path: "../../../../../fonts/publicsans/latin-normal.woff2", weight: "400 600", style: "normal" },
    { path: "../../../../../fonts/publicsans/latin-italic.woff2", weight: "400 600", style: "italic" },
  ],
  display: "swap",
});

// Tenant shortlist — 8 additional faces
const newsreader = localFont({
  src: [
    { path: "../../../../../fonts/newsreader/latin-normal.woff2", weight: "400 600", style: "normal" },
    { path: "../../../../../fonts/newsreader/latin-italic.woff2", weight: "400 600", style: "italic" },
  ],
  display: "swap",
  preload: false,
});

const literata = localFont({
  src: [
    { path: "../../../../../fonts/literata/latin-normal.woff2", weight: "400 600", style: "normal" },
    { path: "../../../../../fonts/literata/latin-italic.woff2", weight: "400 600", style: "italic" },
  ],
  display: "swap",
  preload: false,
});

const lora = localFont({
  src: [
    { path: "../../../../../fonts/lora/latin-normal.woff2", weight: "400 600", style: "normal" },
    { path: "../../../../../fonts/lora/latin-italic.woff2", weight: "400 600", style: "italic" },
  ],
  display: "swap",
  preload: false,
});

// Instrument Serif: display face only. One weight (400), no 600.
// Body font for this combo is Public Sans (noticeFont).
const instrumentSerif = localFont({
  src: [
    { path: "../../../../../fonts/instrumentserif/latin-normal.woff2", weight: "400", style: "normal" },
    { path: "../../../../../fonts/instrumentserif/latin-italic.woff2", weight: "400", style: "italic" },
  ],
  display: "swap",
  preload: false,
});

const archivo = localFont({
  src: [
    { path: "../../../../../fonts/archivo/latin-normal.woff2", weight: "400 600", style: "normal" },
    { path: "../../../../../fonts/archivo/latin-italic.woff2", weight: "400 600", style: "italic" },
  ],
  display: "swap",
  preload: false,
});

const workSans = localFont({
  src: [
    { path: "../../../../../fonts/worksans/latin-normal.woff2", weight: "400 600", style: "normal" },
    { path: "../../../../../fonts/worksans/latin-italic.woff2", weight: "400 600", style: "italic" },
  ],
  display: "swap",
  preload: false,
});

const karla = localFont({
  src: [
    { path: "../../../../../fonts/karla/latin-normal.woff2", weight: "400 600", style: "normal" },
    { path: "../../../../../fonts/karla/latin-italic.woff2", weight: "400 600", style: "italic" },
  ],
  display: "swap",
  preload: false,
});

const ibmPlexSans = localFont({
  src: [
    { path: "../../../../../fonts/ibmplexsans/latin-normal.woff2", weight: "400 600", style: "normal" },
    { path: "../../../../../fonts/ibmplexsans/latin-italic.woff2", weight: "400 600", style: "italic" },
  ],
  display: "swap",
  preload: false,
});

export interface TenantFont {
  /** Applied to .gplm-root — governs body/base text family. */
  className: string;
  /**
   * Present only for Instrument Serif: the CSS className that makes the
   * display face available. Apply to .gplm-root alongside className so
   * the title elements can reference it via fontFamily.
   */
  displayClassName?: string;
  /**
   * When set, apply this CSS font-family value to title elements only.
   * Body text uses the root className family.
   */
  displayFamily?: string;
}

// Canonical lookup used by GroupPublicMasthead to resolve presentation.font_id.
export const tenantFontMap: Record<string, TenantFont> = {
  // Serif text faces
  "source-serif-4": { className: journalFont.className },
  "newsreader":     { className: newsreader.className },
  "literata":       { className: literata.className },
  "lora":           { className: lora.className },
  // Display face — body stays Public Sans
  "instrument-serif": {
    className: noticeFont.className,
    displayClassName: instrumentSerif.className,
    displayFamily: instrumentSerif.style.fontFamily,
  },
  // Sans text faces
  "public-sans":    { className: noticeFont.className },
  "archivo":        { className: archivo.className },
  "work-sans":      { className: workSans.className },
  "karla":          { className: karla.className },
  "ibm-plex-sans":  { className: ibmPlexSans.className },
};

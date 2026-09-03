// Tier 1 defaults + Tier 2 tenant font shortlist (ten faces per spec).
// All instances must be declared at module top-level (next/font/google constraint).
// tenantFontMap keys are the canonical font_id values stored in presentation.font_id.
//
// Instrument Serif is display-only (spec: titles only, body stays Public Sans).
// Its entry carries a displayClassName so the Masthead can apply it narrowly to
// title elements while the root keeps Public Sans for body text.

import {
  Source_Serif_4,
  Public_Sans,
  Newsreader,
  Literata,
  Lora,
  Instrument_Serif,
  Archivo,
  Work_Sans,
  Karla,
  IBM_Plex_Sans,
} from "next/font/google";

// Tier 1 defaults (also in tenantFontMap below)
export const journalFont = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const noticeFont = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// Tenant shortlist — 8 additional faces
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const literata = Literata({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// Instrument Serif: display face only. One weight (400), no 600.
// Body font for this combo is Public Sans (noticeFont).
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const karla = Karla({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
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
    displayFamily: `var(${instrumentSerif.style.fontFamily})`,
  },
  // Sans text faces
  "public-sans":    { className: noticeFont.className },
  "archivo":        { className: archivo.className },
  "work-sans":      { className: workSans.className },
  "karla":          { className: karla.className },
  "ibm-plex-sans":  { className: ibmPlexSans.className },
};

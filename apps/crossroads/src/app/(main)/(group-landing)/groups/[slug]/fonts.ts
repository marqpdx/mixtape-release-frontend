// Tier 1 defaults + Tier 2 tenant font shortlist.
// All instances must be declared at module top-level (next/font/google constraint).
// tenantFontMap keys are the canonical font_id values stored in presentation.font_id.

import {
  Source_Serif_4,
  Public_Sans,
  Playfair_Display,
  Lora,
  EB_Garamond,
  Libre_Baskerville,
  Inter,
  DM_Sans,
  Nunito_Sans,
  Outfit,
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
const playfairDisplay = Playfair_Display({
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

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

// Canonical lookup used by GroupPublicMasthead to resolve presentation.font_id.
// Includes the two Tier 1 defaults so any font_id can be resolved uniformly.
export const tenantFontMap: Record<string, { className: string }> = {
  "source-serif-4": journalFont,    // serif — editorial, professional
  "playfair-display": playfairDisplay, // serif — elegant, literary
  "lora": lora,                     // serif — warm, community
  "eb-garamond": ebGaramond,        // serif — classical, academic
  "libre-baskerville": libreBaskerville, // serif — clean academic
  "public-sans": noticeFont,        // sans — civic, government-adjacent
  "inter": inter,                   // sans — modern professional
  "dm-sans": dmSans,                // sans — clean, neutral
  "nunito-sans": nunitoSans,        // sans — friendly, community
  "outfit": outfit,                 // sans — modern, creative
};

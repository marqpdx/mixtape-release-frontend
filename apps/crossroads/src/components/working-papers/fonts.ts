// apps/crossroads/src/components/working-papers/fonts.ts
//
// Source Serif 4, the serif for Working Papers headings and ledes (Editorial
// and Cards views). Chosen over Alegreya for a quieter page (CTO,
// 2026-11-08). Loaded here, not site-wide, so only Working Papers pages
// fetch it.

import localFont from "next/font/local";

export const wpSerif = localFont({
  src: [
    { path: "../../fonts/sourceserif4/latin-normal.woff2", weight: "400 600", style: "normal" },
    { path: "../../fonts/sourceserif4/latin-italic.woff2", weight: "400 600", style: "italic" },
  ],
  variable: "--font-wp-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

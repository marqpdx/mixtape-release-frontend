// apps/crossroads/src/components/working-papers/fonts.ts
//
// Alegreya, the serif for Working Papers headings (Editorial and Cards views).
// Loaded here, not site-wide, so only Working Papers pages fetch it.

import localFont from "next/font/local";

export const alegreya = localFont({
  src: [
    { path: "../../fonts/alegreya/latin-normal.woff2", weight: "400 600", style: "normal" },
    { path: "../../fonts/alegreya/latin-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-alegreya",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

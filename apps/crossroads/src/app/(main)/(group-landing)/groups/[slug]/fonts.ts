// Tier 1 font instances — Source Serif 4 (Journal) and Public Sans (Notice).
// Both are loaded when the Masthead renders; the active setting governs which className is applied.

import { Source_Serif_4, Public_Sans } from "next/font/google";

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

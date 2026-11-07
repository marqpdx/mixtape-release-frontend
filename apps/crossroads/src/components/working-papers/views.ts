// apps/crossroads/src/components/working-papers/views.ts
//
// The three Working Papers reading views (spec: Puddlejump
// zz/spec-working-papers-reading-views.md). Editorial is the default and the
// print view; nothing about the choice is tracked.

import type { ReadingViewConfig } from "@/components/reading-views/readingViews";

export const WORKING_PAPER_VIEWS: ReadingViewConfig = {
  attribute: "data-wp-view",
  storageKey: "crossroads-wp-view",
  param: "view",
  defaultView: "editorial",
  views: [
    { id: "editorial", label: "Editorial", description: "One column, made for reading through" },
    { id: "index", label: "Index", description: "Compact list with details at the side" },
    { id: "cards", label: "Cards", description: "Each paper on its own card" },
  ],
};

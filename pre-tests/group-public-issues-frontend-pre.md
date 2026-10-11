# GP-10.1–10.2 — Public group Issue cards

Scope: Crossroads public Writing index, Option D card, Past Issues tiles, and tenant accent-label tokens. Article Issue navigation and Continuous Read polish are GP-10.3–10.4 and remain outside this checkpoint.

## Preconditions

- Anonymous group Issues API returns HTTP 200 and a published Issue with public placed pieces. Production previously returned an article-lookup 404; verify core `442326a0 — Build public Issue reading and ordered placement API` is deployed before live acceptance testing.
- Crossroads frontend includes the new card components and locally bundled handoff fonts.
- Use synthetic API responses for isolated browser checks; preserve the page's existing API paths and cache options.
- Fixtures: one five-piece Issue with reading times 4, 4, 4, 5, 6 and one standalone piece; multiple Issues; a 20-piece Issue; a one-piece Issue; an Issue with no numeric designation or introduction; no published Issues.

## Checks

1. Before hydration, the response HTML contains the Issue title, inline article links and every expanded contents row. The expanded region starts with `hidden`.
2. The five-piece card shows the number, month/year, byline, introduction, “In this Issue · 5 pieces · 23 min read,” and three controls in the approved order.
3. Inline title links and “Start with piece 1” use `/groups/{groupSlug}/reading/{pieceSlug}`; “Read Issue #1” uses `/groups/{groupSlug}/writing/issues/{issueSlug}`.
4. “Show all” expands the region, changes to “Hide pieces,” and updates `aria-expanded`. Keyboard activation works and `aria-controls` identifies the region.
5. A 20-piece card initially has eight inline title links and “+12 more”; either expansion control reveals all 20 rows in placement order.
6. The newest Issue is the full card; all older Issues appear as reader-link tiles under “Past Issues,” in API order. No link to an unimplemented archive route appears.
7. “More writing” contains only standalone pieces. A published piece in a draft Issue remains standalone when the public Issues response omits that Issue.
8. The one-piece case uses singular labels. Empty introductions are omitted. A nonnumeric designation is preserved without inventing an Issue number.
9. Missing reading-time data omits unknown per-piece values and the total rather than presenting a partial total as complete.
10. Date falls back to the earliest public placed-piece publication date; bylines deduplicate authors and handle one, two, and multiple authors.
11. At 375px and XL text, the cover becomes a band, controls stack, long titles wrap, and the page and card have no horizontal overflow. Every interactive target is at least 44px tall.
12. Inspect Light, Dark, high-contrast Light and high-contrast Dark with the default theme and a tenant palette. Verify primary button foreground/background contrast is at least 4.5:1, including all four tenant palettes in every mode.
13. With no published Issues, the standalone writing list still renders without an empty Issues section.

## Verification status

Lightweight checks completed on 2026-10-11 with user approval:

- Scoped ESLint on all seven changed TypeScript files: passed.
- Crossroads TypeScript (`tsc --noEmit --incremental false`): passed.
- Metadata assertions: placement order without mutation, earliest-date fallback, distinct authors, nonnumeric designation, unknown reading times, and three-sentence introduction: passed.
- Isolated Next.js fixture importing the actual Issue components, fonts, CSS module and tenant palettes, exercised with Chromium: passed. Verified server-rendered hidden contents, 23-minute total, reader/article URLs, three Past Issues tiles, Enter/Space expansion, eight inline links plus all 20 expanded rows, singular/nonnumeric/unknown-time cases, and empty Issues. No browser runtime errors.
- At 375px with 125% root text, the expanded 20-piece card had no horizontal overflow; all visible Issue links/buttons were at least 44px tall. Desktop and mobile screenshots inspected.
- All four tenant palettes in all four modes resolved the correct button colors. All 16 accent-label contrast pairs passed 4.5:1; minimum measured ratio was 4.80:1.
- Page diff review confirmed fetch URLs, cache options and standalone deduplication were unchanged.

The temporary fixture and runner are in `/tmp/gp10-issue-check`; screenshots are `/tmp/gp10-issue-desktop.png` and `/tmp/gp10-issue-mobile-xl.png`. This exercised the Issue components rather than the complete application providers or production API. Full-page standalone/draft-Issue behavior, default visitor themes and live acceptance remain checks for deployment/GP-10.5. Production must first return the published Issues API successfully. No production build or full test suite was run.

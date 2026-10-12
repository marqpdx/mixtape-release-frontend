# GP-10.4 — Public continuous Issue reader

Scope: Crossroads `/groups/{groupSlug}/writing/issues/{issueSlug}`. Presentation only; existing public Issue/config requests and cache durations preserved. The CTO approved a 60-second cached public writing-list request on 2026-10-11 to join existing reading times by piece ID.

## Built

- Title page: group, designation, publication month/year (with existing earliest-piece fallback), Issue title, full rich introduction, deduplicated authors and total reading time when all pieces have known times.
- Accent-soft contents box with ordered `#piece-NN` anchors and known per-piece minutes.
- Every body visible continuously in server-rendered HTML through the existing PieceBody/TipTapRenderer, with `NN of NN` markers, linked piece titles and quiet separators.
- Shared local Issue fonts, theme-token colors, responsive contents and headings. Removed the duplicate group-name header before the shared group navigation.
- The old `?piece=` query no longer controls disclosures: all bodies are visible. Contents now use the brief's numbered fragments instead of slug-based details IDs.

## Lightweight results — 2026-10-11

- Scoped ESLint and Crossroads TypeScript (`tsc --noEmit --incremental false`): passed.
- Actual page with mocked fetch/imports: approved writing-list route and 60-second cache verified; Issue/config requests preserved. HTTP 404, network rejection and invalid JSON from the optional request keep the complete Issue and omit reading times.
- Isolated Next.js fixture importing the actual IssueReader, local fonts, PieceBody, TipTapRenderer and Crossroads Chakra system: passed in Chromium. The fixture aliases the core barrel directly to its existing color-mode module; it does not reproduce the full application providers.
- Verified full bodies in initial HTML, full introduction rather than the index's three-sentence excerpt, ordered contents, anchor scrolling, individual-page links, padded position markers, known total/per-piece minutes, unknown-time omission, singular labels and nonnumeric designation.
- At 375px and 125% root text: no horizontal overflow and every reader navigation link meets 44px height. Four tenant palettes across Light, Dark, Contrast Light and Contrast Dark rendered without runtime errors. Desktop/mobile screenshots inspected.
- `git diff --check`: passed.

Scratch fixture/runners: `/tmp/gp10-issue-check/app/reader`, `reader-check.cjs`, `reader-api-check.cjs`. Screenshots: `/tmp/gp10-reader-desktop.png`, `/tmp/gp10-reader-mobile-xl.png`.

## Deployment acceptance — GP-10.5

Check the real published Issue via an anonymous browser, including all rich content, custom palette and default visitor themes, Dark/Contrast, XL text and 375px. Confirm contents scrolling with the real group header, reading-time totals against the index, piece title links back to GP-10.3 navigation, and standalone/draft-Issue visibility. This slice has not been deployed or verified against the live API; no production build was run.

## First live-review adjustments

Added a publication-date gutter beside the piece author: stacked weekday/month/year with a larger day numeral, formatted in UTC and exposed as an accessible `<time>`. Missing/invalid dates are omitted. The author uses the requested `margin: -5px 0 10px`; desktop body text shares the author column, while mobile body text uses the full width. Scoped lint, Crossroads TypeScript and the reader Chromium checks passed again, including exact author margins, date text/datetime, anchor navigation, 375px/XL layout and all 16 tenant modes. Screenshot reviewed; these adjustments await deployment.

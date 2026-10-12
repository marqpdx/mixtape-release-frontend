# GP-10.3 — Issue navigation on public pieces

Scope: Crossroads `/groups/{groupSlug}/reading/{articleSlug}`. Presentation only; no schema, migrations or production configuration changes.

## Data contract

- The existing public group Issues list supplies membership and ordered public pieces. The user approved this additional server request on 2026-10-11, with a 120-second cache and normal article rendering on failure.
- Match by piece ID; sort by `order_index` without changing the payload. If several published Issues contain the piece, use the first matching Issue in the endpoint's newest-first order.
- Preserve nonnumeric designations; do not invent Issue numbers. Draft/private Issues are excluded by the existing public API.
- No sponsor group, no matching Issue, HTTP error, network error or invalid JSON: omit Issue navigation and keep the article.

## Lightweight results — 2026-10-11

- Scoped ESLint and Crossroads TypeScript (`tsc --noEmit --incremental false`): passed.
- Actual article page exercised with mocked imports/fetch: passed for successful membership, standalone, no sponsor, HTTP 404, network rejection and invalid JSON. Verified the public endpoint URL and 120-second cache. Metadata's existing requests are unchanged.
- Isolated Next.js fixture importing the actual server navigation components and shared local fonts: passed in Chromium. Verified initial HTML, placement order, reader/article routes, current-piece marker, first/middle/last/single-piece cases, standalone omission and nonnumeric designation.
- At 375px and 125% root text: no navigation overflow, cards stack, all navigation targets meet 44px height, arrow keyboard focus is visible. Desktop/mobile screenshots inspected.
- Four tenant palettes in Light, Dark, Contrast Light and Contrast Dark: rendered without runtime errors and with accent-soft backgrounds. This is a component check, not full application theme/provider acceptance.
- `git diff --check`: passed.

Scratch runners and fixture: `/tmp/gp10-issue-check/navigation-check.cjs`, `article-check.cjs`, `app/navigation/page.tsx`. Screenshots: `/tmp/gp10-navigation-desktop.png`, `/tmp/gp10-navigation-mobile-xl.png`.

## Live acceptance still required

1. Deploy this frontend slice. Confirm a directly shared Issue-piece URL shows the bar below the group header and Continue block after the body.
2. Follow both neighbors and the one-page reader link; compare order with the published Issue.
3. Confirm standalone and independently public pieces in unpublished Issues have no Issue navigation.
4. Verify the real group header/body alignment and default visitor themes, Dark, Contrast and XL text at 375px within the complete app.

GP-10.4 Continuous Read polish and GP-10.5 full QA remain separate checkpoints. No production build or deployment was performed for this slice.

# Group Member View A/B Parity Audit

This audit captures the current A/B differences before further visual alignment. B is the reference for new skins, but no A-only or B-only data section should be removed without product discussion.

## Shared Today

- Both views are selected from the authenticated group page and persist the selected member layout per group.
- Both support the same high-level member tabs: Overview, Members, Conversations, Collections.
- Both expose the `Me` link for signed-in members.
- Both use the shared role switcher wrapper.
- Both use group-aware theme tokens in some places.

## A-Only Or Stronger In A

- Public/member branching lives in `GroupLanding` and `GroupTabs`.
- Public landing page support is only in A.
- Configurable overview layout blocks are rendered through `GroupOverviewTab`.
- Welcome pin rendering is currently in A.
- Dismiss, minimize, restore, and getting-started info behavior are currently in A.
- Legacy overview fallback includes About, Details, Recent Activity, Highlights, and Bazaar cards.
- A still uses some raw color-mode gray tokens in tab surfaces.

## B-Only Or Stronger In B

- Editorial hero treatment with image/emblem fallback.
- Hero stats for members, collections, artifacts, and stewards.
- Ordered library preview with collection summaries.
- Contributor/steward preview.
- Overview-to-collection detail routing with return-to-overview navigation.
- Bazaar offering count in the overview body and stall CTA in the hero.
- Theme-token-first visual styling across the member surface.

## Contract Gaps To Resolve Before C/D

- A should consume the shared member-view data hook so B-only counts and collection bridge data are available consistently.
- B should either render the welcome pin/configurable overview blocks or document where those sections live in the B presentation.
- Shared `Me` link rendering should move out of A/B-local tab components.
- Shared tab definitions should eventually power both A and B.
- The public view path should stay separate from member skins unless product wants public skins too.
- Theme-token usage should be normalized in A before it is treated as a model for future skins.

## Recommended Next Pass

1. Move A member tabs onto `useGroupMemberTabs` while keeping public tabs in `GroupTabs`.
2. Let `GroupOverviewTab` optionally receive `viewData` so it does not refetch collections, members, stall, welcome pin, and overview layout.
3. Decide whether B should embed configurable overview blocks, surface the welcome pin as an editorial section, or explicitly mark those as A-only until a product decision.
4. Extract a shared `GroupMemberMeLink` and use it in both tab implementations.
5. Add C only after A and B consume the same shared contract.

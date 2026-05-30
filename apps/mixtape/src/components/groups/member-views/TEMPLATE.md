# Group Member View Skin Template

This guide is the handoff contract for building new group member view skins such as C, D, or later drop-in UI choices. A skin is a presentation layer over the shared member-view data contract. It may change layout, rhythm, visual language, and emphasis, but it must not silently remove data sections or break role, tab, collection, and theme behavior.

## Reference

- Current reference skin: B.
- Current compatibility skin: A.
- Shared data hook: `useGroupMemberViewData(group)`.
- Shared tab/navigation hook: `useGroupMemberTabs(group.slug)`.
- Layout registry: `GROUP_MEMBER_VIEW_DEFINITIONS`.
- Skin insertion point: `GroupMemberViewRenderer`.

## Required User Flows

Every member view skin must support:

- Role switcher for members/admins.
- Layout switcher for all available member skins.
- `Me` link to `/groups/[slug]/me`.
- Member tabs: Overview, Members, Conversations, Collections.
- Overview-to-collection navigation, including return to overview when a collection was opened from overview.
- Empty states for missing images, collections, members/contributors, welcome content, and bazaar offerings.
- Admin/steward affordances already present in A or B, such as add-image or add-summary prompts.

## Required Data Sections

Do not remove any of these from a skin without discussion:

- Group identity: title, slug, type, visibility, active status, created/updated dates.
- Group media: profile image, background image, emblem fallback.
- Group copy: summary, description, body/about text, author/steward byline.
- Member data: active members, admins, stewards, regular members, member count.
- Contributor/leader data: admins plus non-admin stewards.
- Collections: collection count, item/artifact totals, ordered collection preview, collection summaries.
- Conversations/threadworks tab.
- Bazaar stall and offerings count when present.
- Welcome pin and welcome fallback.
- Configurable overview layout blocks.
- Dismiss/restore behavior for dismissible overview sections, if the skin renders those sections inline.

If a skin intentionally de-emphasizes a section, document where the information appears. Hidden by design is acceptable only when the product owner explicitly approves it.

## Theme Rules

Skins must use group-aware theme tokens:

- `theme.bg`
- `theme.bgSecondary`
- `theme.surface`
- `theme.border`
- `theme.accent`
- `theme.text`
- `theme.textSecondary`

Avoid raw color-mode grays in member skins unless the choice is intentionally neutral and reviewed. Verify the skin in light mode, dark mode, high contrast where practical, and at least one custom group theme.

## Implementation Steps For A New Skin

1. Add the skin id and label to `GROUP_MEMBER_VIEW_DEFINITIONS`.
2. Add the skin component near the existing group member views.
3. Add the skin branch to `GroupMemberViewRenderer`.
4. Consume `useGroupMemberViewData(group)` or accept `viewData` from the parent.
5. Use `useGroupMemberTabs(group.slug)` for member tabs and collection detail routing.
6. Render all required tabs and data sections, or document any deliberate omission before implementation.
7. Use only theme tokens for surfaces, borders, text, and accents.
8. Add responsive behavior for mobile and desktop.
9. Add or update focused tests only after the product behavior is agreed.

## Acceptance Checklist

- Switching A/B/C/D persists per group.
- Switching role views still respects permissions.
- Overview, Members, Conversations, and Collections render.
- Opening a collection from overview lands on the Collections tab and can return to overview.
- Welcome pin content still appears somewhere in the skin, or the omission is explicitly approved.
- Bazaar callouts appear only when offerings exist.
- Missing image/member/collection states are handled.
- Light/dark and group theme switching preserve legibility.
- No existing A-only or B-only data section was removed without discussion.

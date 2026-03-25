# Workbench Curation Frontend Pre-Test Plan

**Feature:** Four-lane curation workbench for group admins
**Date:** 2026-03-24
**Target components:**
- `apps/mixtape/src/components/workbench/WorkbenchCurationWorkArea.tsx`
- `apps/mixtape/src/components/dashboard/group/GroupWorkArea.tsx`
- `packages/api/src/hooks/workbench/useCurationWorkbench.ts`
- `packages/api/src/clients/workbench/curationApi.ts`

**Assumptions:**
- User is authenticated as a group admin (superuser for v0).
- A test group exists with at least one Seed or MillDraft.
- Group dashboard is accessible at `/groups/<slug>?view=admin&section=workbench-curation`.

---

## A) Navigation & Access

### A1. Workbench menu item exists
Steps:
1. Go to `/groups/<slug>?view=admin`.
2. Look for `Workbench` in the left-nav.
Expected:
- `Workbench` menu group is visible.
- `Curation` sub-item is visible within it.

### A2. Workbench section loads
Steps:
1. Click `Curation` in the left-nav.
Expected:
- Four-lane layout renders.
- No uncaught error or fallback "This group section is under development."
- Lane headers `Raw`, `Working Set`, `Craft`, `Published` are all visible.

### A3. Non-admin blocked
Steps:
1. Log in as a regular group member (not admin, not superuser).
2. Navigate directly to `/groups/<slug>?view=admin&section=workbench-curation`.
Expected:
- "Access Denied" panel is shown.
- Four-lane UI does not render.

---

## B) Lane 1 — Raw Pieces

### B1. Pieces load
Steps:
1. Open Workbench Curation as superuser.
Expected:
- Lane 1 shows a list of raw pieces (Seeds, MillDrafts, etc.).
- Each card shows a type badge (`Seed`, `Mill`, `Leaf`, etc.) and an excerpt.

### B2. Search filters pieces
Steps:
1. Type a word from a known piece title into the search box.
Expected:
- List narrows to matching pieces.
- Clearing the search restores the full list.

### B3. Piece selection
Steps:
1. Click a piece card.
Expected:
- Card is highlighted (blue border).
- "Create working item" CTA appears with selected count.

### B4. Multi-select
Steps:
1. Click two piece cards.
Expected:
- Both cards highlighted.
- CTA shows count `(2)`.

---

## C) Lane 2 — Working Set

### C1. Create working item
Steps:
1. Select one or more pieces in Lane 1.
2. Enter a title in the title input.
3. Click `Create working item (N)`.
Expected:
- Working item card appears in Lane 2.
- Lane 2 gets focused (expands to 85%).
- Selection in Lane 1 is cleared.

### C2. Open working item detail
Steps:
1. Click a working item card in Lane 2.
Expected:
- Right-hand editor panel slides open inside Lane 2.
- Item title and status badges are visible.
- Source pieces (memberships) are listed.

### C3. Status transitions
Steps:
1. Open a working item.
2. Click the `ready` status button.
Expected:
- Status badge updates to `ready` (green).

### C4. Remove source piece (before fork lock)
Steps:
1. Open a working item where `body_editing_started = false`.
2. Click the × button on a source piece row.
Expected:
- Piece row is removed.
- Source pieces count decrements.

### C5. Source pieces locked after first body edit
Steps:
1. Open a working item.
2. Trigger an autosave (edit body content in Lane 3 after promotion, then come back — or create a test item known to have `body_editing_started = true`).
Expected:
- × buttons on source pieces are not visible.

### C6. Add piece from Lane 1 to active item
Steps:
1. Open a working item in Lane 2.
2. In Lane 1, locate a piece not yet in the item.
Expected:
- Piece card shows `Add to working item` button.
3. Click it.
Expected:
- Source pieces count in Lane 2 editor increments.

---

## D) Lane Focus / Collapse

### D1. Click lane header to focus
Steps:
1. Click the `Working Set` lane header.
Expected:
- Lane 2 expands to ~85% width.
- Lanes 1, 3, 4 collapse to narrow strips with rotated labels.

### D2. Click same header to unfocus
Steps:
1. While Lane 2 is focused, click its header again.
Expected:
- All four lanes return to equal 25% widths.

### D3. Click different header re-focuses
Steps:
1. With Lane 2 focused, click the `Raw` lane header.
Expected:
- Lane 1 expands; all others collapse.

---

## E) Lane 3 — Craft (editor)

### E1. Lane 3 idle state
Steps:
1. Open Workbench with no promotion yet done.
Expected:
- Lane 3 shows "Promote a working item to open the editor here."

### E2. Editor opens after promotion
Steps:
1. Set a working item's status to `ready`.
2. Click `Promote to Draft`.
Expected:
- Lane 3 automatically focuses (expands).
- `WritingEditorWrapper` loads with the promoted draft piece.
- "Editing promoted draft" label visible above the editor.

### E3. Close editor
Steps:
1. With Lane 3 open (editor visible), click `Close`.
Expected:
- Editor is dismissed.
- Lane 3 returns to idle placeholder.

### E4. Publish from Lane 3 focuses Lane 4
Steps:
1. With draft open in Lane 3, publish the piece.
Expected:
- Lane 4 automatically focuses.
- Lane 3 returns to idle state.

---

## F) Lane 4 — Published

### F1. Published pieces load
Steps:
1. Open Workbench on a group that has at least one published piece.
Expected:
- Lane 4 shows piece cards with titles and publish dates.
- Lane 4 header badge shows correct count.

### F2. Empty state
Steps:
1. Open Workbench on a group with no published pieces.
Expected:
- Lane 4 shows "No published pieces yet."

### F3. Refreshes after promotion → publish
Steps:
1. Promote a working item, then publish the draft from Lane 3.
Expected:
- New piece appears in Lane 4 without a page reload.

---

## G) Promotion Gate Feedback

### G1. Hard gate blocks promotion
Steps:
1. Open a working item with status=`assembling` (not ready).
Expected:
- `Promote to Draft` button is disabled.
- "Set status to 'ready' to enable promotion." hint visible.

### G2. Soft gate shows override option
Steps:
1. Set status to `ready` but ensure `spellcheck_passed = false`.
2. Click `Promote to Draft`.
Expected:
- Gate warnings appear (orange `Warning` badge).
- `Override warnings and promote` button appears.
3. Click override.
Expected:
- Promotion succeeds, Lane 3 opens.

### G3. Success alert
Steps:
1. Promote a fully-valid working item.
Expected:
- `Promoted! WritingPiece created.` success alert appears in Lane 2.

---

## Deliverables

- Screenshot of four-lane layout in default (25/25/25/25) state.
- Screenshot of Lane 2 focused with a working item editor open.
- Screenshot of Lane 3 with `WritingEditorWrapper` loaded after promotion.
- Screenshot of Lane 4 showing at least one published piece card.
- Screenshot of gate failure state (disabled promote button with hint).

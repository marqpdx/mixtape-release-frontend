# Curation UX Updates — Frontend Pre-Test Plan

**Feature:** Curation font size increase + Raw lane type filter
**Date:** 2026-04-04
**Target component:**
- `src/components/workbench/WorkbenchCurationWorkArea.tsx`

**Assumptions:**
- User is authenticated as group admin (or superuser).
- A test group exists with at least one Seed, one Leaf, one Mill draft, and one Working Document in the Raw lane.
- Group dashboard is accessible at `/groups/<slug>?view=admin&section=workbench-curation`.

---

## A) Font Size — General

### A1. Lane header labels are larger
Steps:
1. Open Curation.
Expected:
- "Raw", "Working Set", "Craft", "Published" lane headers render noticeably larger than before.
- Text is `md` size (≈1rem), not `sm`.

### A2. Piece titles in Lane 1 are larger
Steps:
1. Open Curation with raw pieces present.
Expected:
- Piece card titles in Lane 1 render at `md` size.

### A3. Piece excerpts in Lane 1 are larger
Steps:
1. Open Curation with raw pieces that have excerpts.
Expected:
- Excerpt text in Lane 1 cards renders at `sm` size (previously `xs`).

### A4. Working item titles in Lane 2 are larger
Steps:
1. Open Curation with at least one working item.
Expected:
- Working item card titles in Lane 2 render at `md` size.

### A5. Empty-state messages are larger
Steps:
1. Open Curation on a group with no working items (Lane 2 is empty).
Expected:
- "No working items yet." text renders at `sm` size.

### A6. Section labels in the working item editor are larger
Steps:
1. Open a working item so the Lane 2 editor panel is visible.
Expected:
- "SOURCE PIECES", "BODY", "PROMOTE TO DRAFT" section header labels render at `sm` size (previously `xs`).

### A7. Collapsed lane labels are larger
Steps:
1. Click a lane header to focus it (85% state).
Expected:
- The rotated vertical labels on collapsed lanes ("Raw", "Working Set", etc.) render at `sm` size.

### A8. Published piece content in Lane 4 is larger
Steps:
1. Open Curation on a group with published pieces.
Expected:
- Published piece titles in Lane 4 render at `md` size.
- Published piece excerpts render at `sm` size.
- Published dates render at `sm` size.

### A9. Main heading size is correct
Steps:
1. Observe the "Workbench" heading at the top of the Curation area.
Expected:
- Heading renders at `xl` size (previously `lg`). Still clearly the largest text element on the page.

---

## B) Raw Lane Type Filter — Appearance

### B1. Filter chips not shown when Lane 1 is at 25%
Steps:
1. Open Curation in the default equal-width (25/25/25/25) layout.
Expected:
- No filter chips visible in Lane 1 — only the search input.

### B2. Filter chips appear when Lane 1 is focused (85%)
Steps:
1. Click the "Raw" lane header to focus Lane 1.
Expected:
- Four filter chips appear below the search input: **Drafts**, **Seeds**, **Leaves**, **Pup'd**.
- All chips are initially in the unselected (outline) state.

### B3. Chip colours match type badge colours
Steps:
1. With Lane 1 focused, observe chip colours.
Expected:
- **Drafts** chip is purple-tinted (matching Working Document badges).
- **Seeds** chip is green-tinted.
- **Leaves** chip is teal-tinted.
- **Pup'd** chip is blue-tinted (matching Mill badges).

### B4. Chips remain hidden when Lane 1 is collapsed
Steps:
1. Focus Lane 1, confirm chips appear.
2. Click the "Raw" header again to unfocus (return to 25/25/25/25).
Expected:
- Chips are no longer visible.

---

## C) Raw Lane Type Filter — Behaviour

### C1. Selecting one chip filters the list
Steps:
1. Focus Lane 1.
2. Click the **Seeds** chip.
Expected:
- Chip becomes filled/solid (selected state).
- Piece list shows only items with type `Seed`.
- Items of other types (Leaf, Mill, Draft) are hidden.

### C2. Selecting multiple chips shows union
Steps:
1. Focus Lane 1.
2. Click **Seeds**, then click **Leaves**.
Expected:
- Both chips are in selected state.
- Piece list shows Seeds and Leaves; no Drafts or Pup'd pieces.

### C3. Deselecting a chip restores items of that type
Steps:
1. With **Seeds** and **Leaves** both selected, click **Seeds** to deselect.
Expected:
- Only **Leaves** remains selected.
- Piece list shows only Leaves.

### C4. Deselecting all chips shows everything
Steps:
1. With one chip selected, click it to deselect.
Expected:
- No chips are in selected state.
- Full unfiltered piece list is shown.

### C5. Type filter and search box compose
Steps:
1. Focus Lane 1.
2. Click **Seeds** to filter to Seeds only.
3. Type a word from a known Seed's title in the search box.
Expected:
- Only Seeds matching the search term are shown (both filters apply together).

### C6. Filter selection persists across lane focus/unfocus
Steps:
1. Focus Lane 1, select **Drafts** chip.
2. Click the "Raw" header to unfocus (25/25/25/25 layout).
3. Click the "Raw" header again to refocus.
Expected:
- **Drafts** chip is still selected on re-focus.
- Piece list is still filtered to Drafts.

### C7. Filter selection persists across page reload
Steps:
1. Focus Lane 1, select **Seeds** chip.
2. Reload the page.
3. Navigate back to Curation and focus Lane 1.
Expected:
- **Seeds** chip is still selected (stored in `localStorage` under `curation:rawTypeFilter`).

### C8. Filtering to an empty result shows the empty state
Steps:
1. Focus Lane 1.
2. Select a type that has no pieces in this group (e.g. **Leaves** if none exist).
Expected:
- "No raw pieces yet." empty-state message shown.
- No error or spinner.

---

## Deliverables

- Screenshot of Lane 1 at 25% (no chips visible) — font comparison vs prior baseline.
- Screenshot of Lane 1 at 85% with all four chips in unselected state.
- Screenshot of Lane 1 at 85% with **Seeds** chip selected and list filtered.
- Screenshot of Lane 1 at 85% with **Seeds** + **Leaves** both selected.
- Screenshot of the working item editor panel showing larger section labels.
- Screenshot of Lane 4 showing larger published piece titles/excerpts.

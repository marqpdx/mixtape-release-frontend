# Writing Series UI — Frontend Pre-Test Plan

**Feature:** Series navigator rail, health badges, series assignment, inline series creation, Series Writing work area
**Date:** 2026-04-04
**Target components:**
- `src/components/writing/SeriesGroupView.tsx`
- `src/components/writing/WritingListWrapper.tsx`
- `src/components/writing/SeriesWritingWorkArea.tsx`
- `src/components/dashboard/group/groupConfig.ts`

**Assumptions:**
- User is authenticated as group admin (or superuser).
- Test group has:
  - At least 2 named series (e.g. "Phase 0", "Phase 1")
  - At least 3 published pieces spread across series
  - At least 2 draft pieces
  - At least 1 piece with no series assigned (unassigned)
- Group dashboard accessible at `/groups/<slug>?view=admin&section=writing`.

---

## A) By Series Tab — Navigation and Layout

### A1. "By Series" tab option exists
Steps:
1. Go to Writing section of the group dashboard.
2. Look at the grouping mode tabs (List / By Tag / By Where / …).
Expected:
- **By Series** tab is visible (group context only).

### A2. Switching to By Series shows the split layout
Steps:
1. Click **By Series**.
Expected:
- Layout splits: a narrow left rail (~180px) appears on the left.
- Series names are listed in the rail.
- Main panel shows pieces grouped under series headers.

### A3. Left rail contains correct entries
Steps:
1. With By Series active, examine the left rail.
Expected:
- **All pieces** entry at the top.
- Each named series appears as a labelled row with a piece-count badge.
- **Unassigned** entry at the bottom (if any unassigned pieces exist).

### A4. Rail shows correct piece counts
Steps:
1. Note the count badge next to a series name in the rail.
Expected:
- Count matches the number of pieces (published + draft) in that series in the main panel.

### A5. "All pieces" shows everything
Steps:
1. Click **All pieces** in the rail.
Expected:
- All series groups render in the main panel.
- No pieces are hidden.

### A6. Clicking a series name filters the main panel
Steps:
1. Click a series name (e.g. "Phase 1") in the rail.
Expected:
- Only the "Phase 1" series group renders in the main panel.
- Other series groups are hidden.
- The clicked series row is highlighted/bold in the rail.

### A7. Clicking "Unassigned" shows only unassigned pieces
Steps:
1. Click **Unassigned** in the rail.
Expected:
- Only the "Unassigned" group renders in the main panel.
- All named series groups are hidden.

### A8. Clicking "All pieces" restores full view
Steps:
1. With a series selected, click **All pieces**.
Expected:
- All series groups are visible again.

---

## B) Series Headers and Health Badges

### B1. Each series header shows health badges
Steps:
1. In By Series view with "All pieces" selected, observe each series header.
Expected:
- Each header shows one or more coloured count badges (e.g. `2 pub`, `1 sched`, `3 draft`).
- Only non-zero counts appear.

### B2. Published count badge is green
Steps:
1. Observe a series that has published pieces.
Expected:
- `N pub` badge has green colouring.

### B3. Draft count badge is gray
Steps:
1. Observe a series that has draft pieces.
Expected:
- `N draft` badge has gray colouring.

### B4. Piece count label reflects actual pieces in group
Steps:
1. Note the "N pieces" label on the right of a series header.
Expected:
- Count matches the visible rows in that series.

### B5. Health badges update after a status change
Steps:
1. Note the draft count for a series.
2. In a separate tab, publish one of the draft pieces in that series.
3. Return and refresh.
Expected:
- `pub` count increases by 1; `draft` count decreases by 1.

---

## C) Ordering Pieces Within a Series

### C1. Drag handle is visible on each piece row
Steps:
1. In By Series view, observe any series with 2+ pieces.
Expected:
- A grip icon appears on the far left of each row.

### C2. Dragging reorders pieces
Steps:
1. Drag the second piece above the first piece in a series.
Expected:
- Pieces swap positions.
- Order numbers (1, 2, 3…) update to reflect new order.
- "Saving…" indicator briefly appears.

### C3. Order persists after reload
Steps:
1. Drag a piece to a new position.
2. Reload the page and return to By Series.
Expected:
- Piece remains in the new position.

---

## D) Series Assignment (Reassigning a Piece)

### D1. Each piece row has a series selector
Steps:
1. In By Series view (with `allSeries` available), observe piece rows.
Expected:
- Each row shows a small dropdown/selector to the right of the title.
- Current series (or "Unassigned") is the selected value.

### D2. Selector shows all series as options
Steps:
1. Click the series selector on any piece.
Expected:
- Dropdown lists all named series.
- "Unassigned" option is available at the top.

### D3. Changing series reassigns the piece
Steps:
1. On a piece currently in "Phase 0", change the selector to "Phase 1".
Expected:
- Piece disappears from the "Phase 0" group.
- Piece appears in the "Phase 1" group.
- Rail counts update accordingly.

### D4. Setting selector to "Unassigned" removes series
Steps:
1. On an assigned piece, change the selector to "Unassigned".
Expected:
- Piece moves to the "Unassigned" group.
- Original series group count decreases.

### D5. Assignment persists after reload
Steps:
1. Reassign a piece to a different series.
2. Reload and return to By Series.
Expected:
- Piece is in the newly assigned series.

---

## E) Inline Series Creation

### E1. Creation form is visible
Steps:
1. In By Series view, scroll to the bottom of the main panel.
Expected:
- A text input with placeholder "New series title…" and an **Add series** button are visible.

### E2. Creating a series with a valid title succeeds
Steps:
1. Type "Test Series Alpha" in the title input.
2. Click **Add series** (or press Enter).
Expected:
- Form clears.
- "Test Series Alpha" appears in the left rail with a count of 0.
- A new series group header appears in the main panel (empty).

### E3. Submit via Enter key works
Steps:
1. Type a series title and press **Enter**.
Expected:
- Series is created (same as clicking the button).

### E4. Empty title does not submit
Steps:
1. Leave the title input blank and click **Add series**.
Expected:
- Nothing happens. No series is created.

### E5. Add series button is disabled when title is empty
Steps:
1. Observe the **Add series** button with an empty input.
Expected:
- Button is visually disabled.

---

## F) Series Writing Work Area (Admin)

### F1. "Series Writing ✦" menu item exists
Steps:
1. Log in as admin/superuser.
2. Open the group dashboard left nav, Content section.
Expected:
- **Series Writing ✦** appears as a menu item under Content.

### F2. Non-admin cannot access the section
Steps:
1. Log in as a regular group member (not admin).
2. Navigate to `/groups/<slug>?view=admin&section=series-writing`.
Expected:
- Access denied panel is shown, or the item is not visible in the nav.

### F3. Series Writing work area loads
Steps:
1. Click **Series Writing ✦** as admin.
Expected:
- A full-width split layout loads.
- Left rail with series list is visible.
- Main panel shows piece groups.
- "Series Writing" heading and group name are shown at the top.

### F4. Left rail matches the Writing > By Series rail
Steps:
1. Note the series and counts in Series Writing.
2. Navigate to Writing → By Series.
Expected:
- Same series names and counts appear in both views (data is the same).

### F5. Rail navigation works independently
Steps:
1. In Series Writing, click a series name.
Expected:
- Main panel filters to that series only.
- Rail item is highlighted.

### F6. Health badges appear in Series Writing
Steps:
1. Observe series headers in the main panel of Series Writing.
Expected:
- Health badges (pub/sched/draft) are present, same as in By Series.

### F7. Series assignment works in Series Writing
Steps:
1. Reassign a piece to a different series using the row selector.
Expected:
- Piece moves to the new series group.
- Rail counts update.

### F8. Series creation works in Series Writing
Steps:
1. Scroll to the bottom of the main panel.
2. Create a new series.
Expected:
- Series appears in the rail.
- Empty series group header appears in the main panel.

### F9. Edit button navigates to the Write section
Steps:
1. Click the pencil (Edit) icon on any piece row.
Expected:
- Navigates to the Write section with that piece loaded.

---

## G) Persistence and Edge Cases

### G1. Rail selection resets to "All pieces" on section change
Steps:
1. In By Series, select "Phase 1".
2. Navigate to a different section (e.g. Writing > List).
3. Return to Writing > By Series.
Expected:
- Left rail resets to "All pieces" (no persisted filter across nav).

### G2. Series list loads after creation without full page reload
Steps:
1. Create a new series inline.
Expected:
- New series appears in the rail immediately without navigating away.

### G3. Unassigned entry absent when all pieces are assigned
Steps:
1. Ensure all pieces in the group are assigned to a series.
Expected:
- "Unassigned" entry does not appear in the rail.

### G4. Empty series group shows placeholder
Steps:
1. Create a new series with no pieces.
Expected:
- Series header is visible in the main panel.
- An empty-state placeholder ("No pieces in this series yet.") appears below the header.

---

## Deliverables

- Screenshot of Writing area in By Series mode showing split layout (left rail + main panel).
- Screenshot of left rail with series names, counts, and "Unassigned" entry.
- Screenshot of main panel filtered to one series (other series hidden).
- Screenshot of a series header with health badges visible.
- Screenshot of a piece row showing the series assignment dropdown.
- Screenshot of the series creation form at the bottom of the panel.
- Screenshot of the Series Writing ✦ work area (full split layout, admin view).
- Screenshot of access denied state when a non-admin tries to reach Series Writing.

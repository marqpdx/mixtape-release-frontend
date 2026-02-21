# Dispatch Outline Phase 1 — Frontend Test Plan

**Feature:** Read-Only Outline Drawer (heading extraction from TipTap content)
**Date:** 2026-02-20
**Modules:** `components/writing/outline/`, `components/editor/`
**Components:** `OutlineDrawer.tsx`, `TipTapToolbar.tsx`, `TipTapEditor.tsx`

---

## What was built

### Frontend
- `OutlineDrawer` component: left-side Chakra Drawer that extracts H1/H2/H3 from TipTap editor, renders nested tree, click-to-navigate
- Heading toolbar buttons (H1, H2, H3) added to `TipTapToolbar`
- `"heading"` added to `DEFAULT_TOOLBAR_OPTIONS` in TipTapEditor
- "Outline" toggle button in `WriteComposer` top bar

### Backend
- No changes (Phase 1 is frontend-only)

---

## Test Approach

Phase 1 is entirely frontend. Tests are manual + unit-level verification of the heading extraction logic. No Django tests needed.

---

## A) Heading Extraction

### A1. Empty document shows empty state
Steps:
1) Open WriteComposer with empty document.
2) Click "Outline" button.
Expected:
- Drawer opens on left side.
- Shows "No headings found" message.
- Shows guidance text about adding H1/H2/H3.

### A2. Single heading appears in outline
Steps:
1) Type a line, select it, click H1 button.
2) Open Outline drawer.
Expected:
- One entry shows with label "H1" and the heading text.

### A3. Multiple heading levels create nested tree
Steps:
1) Create document with: H1 "Intro", H2 "Background", H2 "Methods", H3 "Sampling", H1 "Results".
2) Open Outline drawer.
Expected:
- Tree structure:
  ```
  H1  Intro
    H2  Background
    H2  Methods
      H3  Sampling
  H1  Results
  ```

### A4. Headings update live as document changes
Steps:
1) Open Outline drawer.
2) Add a new H2 heading in the editor.
Expected:
- Outline updates immediately (no re-open required).

### A5. Deleting a heading removes it from outline
Steps:
1) Open Outline with several headings.
2) Delete a heading from the editor.
Expected:
- Heading disappears from outline.

### A6. Empty heading text shows fallback
Steps:
1) Click H1 button to create heading, leave it blank.
2) Open Outline.
Expected:
- Entry shows "(untitled heading)" as text.

---

## B) Navigation (click-to-scroll)

### B1. Click heading scrolls editor to that position
Steps:
1) Create a long document with multiple headings.
2) Open Outline drawer.
3) Click a heading that's off-screen.
Expected:
- Editor scrolls to the heading.
- Cursor is placed in the heading.

### B2. Active heading highlights based on cursor
Steps:
1) Open Outline drawer.
2) Place cursor inside the second heading's section.
Expected:
- Second heading is highlighted (blue background) in the outline.

### B3. Active heading updates as user types
Steps:
1) Open Outline drawer.
2) Move cursor between different sections.
Expected:
- Highlighted heading in outline follows cursor position.

---

## C) Toolbar Integration

### C1. H1/H2/H3 buttons appear in toolbar
Steps:
1) Open WriteComposer.
Expected:
- H1, H2, H3 buttons visible in toolbar before the formatting buttons.
- Visual separator between heading buttons and Bold/Italic/etc.

### C2. Heading buttons toggle correctly
Steps:
1) Type a line.
2) Click H1 — text becomes H1.
3) Click H1 again — text reverts to paragraph.
4) Click H2 — text becomes H2.
Expected:
- Active state (pressed appearance) reflects current heading level.

### C3. Heading buttons work with selection
Steps:
1) Type multiple lines.
2) Place cursor in one line, click H2.
Expected:
- Only that line becomes H2.
- Other lines unchanged.

---

## D) Drawer UX

### D1. Drawer opens on left side
Steps:
1) Click "Outline" button.
Expected:
- Drawer slides in from the left.
- Transparent backdrop (editor remains visible).

### D2. Drawer closes via Close button
Steps:
1) Open drawer, click "Close" button.
Expected:
- Drawer slides out.

### D3. Drawer closes via clicking outside
Steps:
1) Open drawer, click on the editor area.
Expected:
- Drawer closes.

### D4. Section count displays correctly
Steps:
1) Create 3 headings, open Outline.
Expected:
- Header shows "3 sections".
2) Create 1 heading.
Expected:
- Header shows "1 section" (singular).

---

## E) Edge Cases

### E1. Collaborative mode works
Steps:
1) Enable collaboration on a document.
2) Open Outline drawer.
Expected:
- Headings extracted from Yjs-backed editor.
- Click-to-scroll works.

### E2. Very long heading text truncates
Steps:
1) Create heading with 200+ characters.
2) Open Outline.
Expected:
- Text truncated with ellipsis (single line).

### E3. Many headings (20+) scrollable
Steps:
1) Create 25 headings.
2) Open Outline.
Expected:
- Drawer body scrolls to show all headings.

### E4. Rapid open/close doesn't break
Steps:
1) Rapidly click Outline button multiple times.
Expected:
- No errors, drawer state consistent.

---

## Deliverables
- Screenshot of outline drawer with nested headings.
- Screenshot of heading toolbar buttons.
- Verify no console errors during all scenarios.

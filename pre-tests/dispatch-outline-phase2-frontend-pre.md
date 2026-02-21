# Dispatch Outline Phase 2 — Frontend Pre-Test

**Feature:** Persistent Outline with API-backed CRUD, markers, and enable toggle
**Date:** 2026-02-20
**Modules:** `components/writing/outline/`, `components/editor/extensions/`, `packages/api/clients/dispatch/`
**Components:** `OutlineDrawer.tsx`, `OutlineMarker.ts`, `outlineApi.ts`
**Backend test plan:** `mixtape-release-core/pre-tests/dispatch-outline-pre.md`

---

## What was built

### Frontend
- `outlineApi.ts` — API client: `fetchOutline`, `createOutlineNode`, `updateOutlineNode`, `deleteOutlineNode`, `enableOutline`
- `OutlineMarker.ts` — TipTap inline atom node (invisible marker with `nodeId` attribute, `insertOutlineMarker` / `removeOutlineMarker` commands)
- `OutlineDrawer.tsx` — Upgraded to dual-mode: Phase 1 (headings fallback) + Phase 2 (persistent API-backed outline with CRUD)
- `enable_outline` added to `WritingPiece` TypeScript interface
- `OutlineMarker` registered in `TipTapEditor.tsx` base extensions
- `WriteComposer.tsx` passes `pieceId` + `enableOutline` to drawer

### Backend (already existed)
- `DispatchOutlineNode` model, CRUD API endpoints, `WritingPiece.enable_outline` boolean

---

## Environment contract

- `E2E_BASE_URL` — app base URL
- `E2E_AUTHOR_EMAIL` / `E2E_AUTHOR_PASSWORD` — user who owns a dispatch WritingPiece
- Seeded data: at least one WritingPiece with `writing_kind=dispatch`, `enable_outline=false`

---

## Selector strategy

- Drawer: `getByRole('dialog')` or scoped to `[data-scope="drawer"]`
- Outline button: `getByRole('button', { name: /outline/i })`
- Close button: `getByRole('button', { name: /close/i })`
- Enable button: `getByRole('button', { name: /enable persistent outline/i })`
- Add Section button: `getByRole('button', { name: /add section/i })`
- Section title text: scoped `getByText()` within drawer body
- Delete button: `getByRole('button', { name: /delete section/i })`

---

## A) Dual Mode — Phase 1 Fallback

### A1. Outline disabled shows headings mode
Steps:
1) Open WriteComposer for a piece with `enable_outline=false`.
2) Add an H1 heading in the editor.
3) Click "Outline" button.
Expected:
- Drawer shows auto-detected heading with "H1" label.
- Footer shows "Enable Persistent Outline" button.
- Header shows "1 section (auto-detected)".

### A2. Enable persistent outline switches mode
Steps:
1) Open Outline drawer (Phase 1 mode).
2) Click "Enable Persistent Outline".
Expected:
- PATCH `/api/writing/pieces/{id}` sent with `{enable_outline: true}`.
- Drawer switches to Phase 2 mode.
- "Enable Persistent Outline" button disappears.
- "No sections yet" empty state shown (no persistent nodes exist).
- "+ Add Section" button visible.

---

## B) Create Section

### B1. Add section creates node and inserts marker
Steps:
1) Enable outline on a piece.
2) Open Outline drawer.
3) Place cursor in the editor at a specific position.
4) Click "+ Add Section".
Expected:
- POST `/api/dispatch/outline` called with `{writing_piece, title: "New Section", anchor_target: <uuid>}`.
- Outline node appears in drawer with title "New Section".
- Invisible marker inserted at cursor position in editor (check via `editor.getJSON()` for `outlineMarker` node).

### B2. Multiple sections create ordered list
Steps:
1) Add 3 sections.
Expected:
- All 3 appear in drawer in creation order.
- Each has a unique `anchor_target`.

---

## C) Edit Section Title

### C1. Double-click to edit title
Steps:
1) Create a section.
2) Double-click the section title in the drawer.
Expected:
- Title text replaced by an inline input field.
- Input pre-filled with current title and selected.

### C2. Save title on Enter
Steps:
1) Enter edit mode, change title to "Introduction".
2) Press Enter.
Expected:
- PATCH `/api/dispatch/outline/node/{id}` sent with `{title: "Introduction"}`.
- Drawer shows updated title.

### C3. Save title on blur
Steps:
1) Enter edit mode, change title.
2) Click elsewhere (blur).
Expected:
- Title saved via PATCH.

### C4. Cancel edit on Escape
Steps:
1) Enter edit mode, change title.
2) Press Escape.
Expected:
- Input reverts to original title.
- No PATCH sent.

### C5. Empty title reverts
Steps:
1) Enter edit mode, clear the title.
2) Press Enter.
Expected:
- Title reverts to original (no save of empty string).

---

## D) Delete Section

### D1. Delete removes node and marker
Steps:
1) Create a section (note the marker in editor JSON).
2) Click the delete (trash) button on the section.
Expected:
- DELETE `/api/dispatch/outline/node/{id}` sent.
- Section disappears from drawer.
- Marker node removed from editor content.

### D2. Delete with children cascades
Steps:
1) Create a parent section and a child section (if hierarchy supported in UI).
2) Delete the parent.
Expected:
- Both parent and children removed from drawer.
- Backend handles cascade.

---

## E) Navigation — Marker Anchoring

### E1. Click section scrolls to marker
Steps:
1) Create a section (marker inserted at specific position).
2) Scroll editor away from the marker.
3) Click the section title in the drawer.
Expected:
- Editor scrolls to the marker position.
- Cursor placed at marker.

### E2. Linked vs unlinked indicators
Steps:
1) Create a section with anchor (green dot).
2) Manually delete the marker from the editor (select and backspace the invisible node).
3) Observe drawer.
Expected:
- Section still appears in drawer (not removed — "orphaned").
- Dot changes from green to gray (unlinked).
- Click does nothing (marker not found, no crash).

---

## F) State Persistence

### F1. Outline survives page reload
Steps:
1) Create 3 sections.
2) Refresh the page.
3) Open Outline drawer.
Expected:
- All 3 sections loaded from API.
- Titles, order preserved.

### F2. Markers survive autosave cycle
Steps:
1) Create a section (marker inserted).
2) Type some text (trigger autosave).
3) Refresh page.
4) Open Outline drawer, click section.
Expected:
- Marker still present in `body_json`.
- Navigation works.

---

## G) Edge Cases

### G1. Outline drawer works with no editor (loading state)
Steps:
1) Open outline before editor is ready (e.g., collab mode pending).
Expected:
- Drawer opens without crashing.
- Shows loading or empty state.

### G2. Permission denied (non-author, non-collaborator)
Steps:
1) Log in as a user who is NOT the author or a collaborator.
2) Attempt to open outline.
Expected:
- API returns 403.
- Drawer shows appropriate error or empty state.

### G3. Rapid add/delete doesn't break
Steps:
1) Click "+ Add Section" 5 times quickly.
Expected:
- 5 sections created (no duplicates, no errors).
- All mutations complete.

---

## Deliverables
- Screenshot of Phase 2 outline drawer with sections.
- Screenshot showing green (linked) vs gray (unlinked) dots.
- Screenshot of inline title editing.
- Verify `outlineMarker` node appears in `editor.getJSON()`.
- Verify no console errors during all scenarios.

---

## Run Commands
```bash
# When converted to Playwright
npx playwright test pre-tests/playwright/dispatch-outline-phase2.spec.ts
```

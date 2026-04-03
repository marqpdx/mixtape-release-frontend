# Copy Desk Intelligence — Frontend Pre-Test Plan

**Feature:** Copy Desk Intelligence — word count goal, AI split suggestions, split markers, execute split
**Date:** 2026-04-02
**Target components:**
- `src/components/writing/copydesk/CopyDesk.tsx` (Statistics panel)
- `src/components/editor/extensions/SplitMarker.ts` + `SplitMarkerView.tsx`
- `src/components/editor/extensions/GristCommands.ts`
- `src/components/editor/TipTapToolbar.tsx` (scissors button)
- `src/components/writing/copydesk/SplitSuggestionCallout.tsx`
- `src/components/writing/copydesk/ExecuteSplitBanner.tsx`
- `src/hooks/useStreamAuthoring.ts` (`resumeSession`)

**Backend test plan:** `mixtape-release-core/pre-tests/copy-desk-intelligence-backend-pre.md`

**Assumptions:**
- User is authenticated as an author.
- A draft `WritingPiece` is open in the editor (solo mode, not collab).
- The Copy Desk sidebar is accessible.

---

## A) Word Count Goal

### A1. Goal input renders in Statistics panel
Steps:
1. Open a draft piece in the writer.
2. Open the Copy Desk sidebar → Statistics panel.
Expected:
- **Word Count Goal** field is visible.
- Field accepts a numeric value.
- Placeholder or label reads "Word Count Goal" (or similar).

### A2. Setting a goal persists
Steps:
1. Type `800` in the Word Count Goal field.
2. Save or blur the field.
Expected:
- Value persists (survives a page reload or a subsequent autosave cycle).

### A3. Over-target indicator appears
Steps:
1. Set Word Count Goal to `50` (lower than current document word count).
Expected:
- A small triangle (⚠) or over-target icon appears next to the word count display.
- No modal, no alert — just the icon.

### A4. Clearing the goal removes the indicator
Steps:
1. Clear the Word Count Goal field.
Expected:
- Over-target icon disappears.

---

## B) Split Suggestion Callout

### B1. Callout does not appear without a goal
Steps:
1. Ensure `suggest_splits` is enabled but `target_wordcount` is null.
2. Write enough text to exceed any threshold.
Expected:
- No split suggestion callout appears.

### B2. Callout appears after AI generates suggestion
Steps:
1. Set a goal, enable Suggest splitting, write content to exceed 115% of goal.
2. Wait for AI task to complete (or mock `status="ready"` via API).
Expected:
- Small orange callout appears bottom-right:
  > "This piece may work well as 2 separate parts. Want to see where?"
- Callout has three buttons: **Tell me more**, **Not now**, **Keep as one piece**.

### B3. "Not now" dismisses the callout
Steps:
1. With callout visible, click **Not now**.
Expected:
- Callout disappears.
- `suggest_splits` remains true (can reappear if writing continues).

### B4. "Keep as one piece" dismisses permanently
Steps:
1. With callout visible, click **Keep as one piece**.
Expected:
- Callout disappears.
- Suggest splitting toggle in Statistics panel switches off.
- Callout does not reappear even after further writing.

### B5. "Tell me more" shows split rationale
Steps:
1. With callout visible, click **Tell me more**.
Expected:
- Loading spinner briefly visible, then callout expands.
- One or more orange boxes each showing:
  - "Split N — after paragraph X"
  - Rationale text in smaller gray font.
- **Insert split markers** button is visible.
- **Keep as one piece** and **Dismiss** buttons visible.

### B6. "Tell me more" with no strong split points
Steps:
1. Mock or engineer a scenario where AI returns an empty `suggestions` array.
Expected:
- Text: "The AI found no strong split points. Your piece reads well as one."
- No orange split point boxes.

---

## C) Split Markers — Manual Insertion

### C1. Toolbar scissors button inserts a marker
Steps:
1. Place cursor in a paragraph.
2. Click the scissors (✂) icon in the editor toolbar.
Expected:
- An orange split marker divider appears in the document at the cursor position.
- Marker shows "Split here ────────────────────────────".

### C2. Slash command popup shows `/split`
Steps:
1. Move cursor to a new empty line.
2. Type `/`.
Expected:
- Suggestion popup appears.
- `/ split` (with label "Mark a split point — divide this piece into two") is listed.

### C3. Selecting `/split` from popup inserts a marker
Steps:
1. Type `/`, select `split` from the popup.
Expected:
- Marker inserted at the current paragraph.

### C4. Fenced `/split` command (Mode B)
Steps:
1. On its own paragraph, type `/split` and press **Enter**.
Expected:
- The `/split` text is replaced by a split marker.
- Marker shows "Split here ────────────────────────────".

### C5. Fenced `/split` with a title
Steps:
1. On its own paragraph, type `/split My Second Chapter` and press **Enter**.
Expected:
- Marker replaced by a split marker.
- Marker label shows the title text: "Split here ─── My Second Chapter".

### C6. Markers do not appear in read/published view
Steps:
1. Publish (or preview) the piece.
Expected:
- No orange split marker UI visible in the rendered output.

---

## D) Split Markers — AI-Inserted

### D1. "Insert split markers" button inserts markers at suggested positions
Steps:
1. With the "Tell me more" rationale view open and split points shown, click **Insert split markers**.
Expected:
- Markers appear in the document at the AI's suggested paragraph positions.
- Each marker shows the rationale text in italic below the scissors line.
- Callout closes (transitions to dismissed state).

### D2. AI marker is visually distinct from manual marker
Steps:
1. Insert a manual marker (toolbar button).
2. Insert an AI-suggested marker via "Insert split markers".
Expected:
- Manual marker shows "Split here ────────────────────────────".
- AI marker shows "✂ AI split point ─── *(rationale text)*".

---

## E) Split Markers — Editing

### E1. Clicking a marker selects it
Steps:
1. Click on an existing split marker.
Expected:
- Marker gets an orange outline (selection state).

### E2. Backspace/Delete removes a selected marker
Steps:
1. Click a split marker to select it.
2. Press **Backspace** or **Delete**.
Expected:
- Marker is removed from the document.

### E3. Markers persist across autosave
Steps:
1. Insert a split marker.
2. Wait for autosave (or trigger it).
3. Reload the page.
Expected:
- Split marker is still present in the document.

---

## F) Execute Split Banner

### F1. Banner appears when markers are present
Steps:
1. Insert at least one split marker into the document.
Expected:
- "Ready to split" banner appears bottom-right.
- Text shows the marker count: "1 split marker in this piece" (or N for multiple).
- **Execute split** button is visible.

### F2. Banner shows correct count for multiple markers
Steps:
1. Insert 3 split markers.
Expected:
- Banner reads "3 split markers in this piece."

### F3. Banner disappears when all markers are removed
Steps:
1. With banner visible, remove all split markers.
Expected:
- Banner disappears.

### F4. Banner does not appear in collab mode
Steps:
1. Switch the editor to collaborative (Yjs) mode.
2. Ensure split markers exist in the document.
Expected:
- Execute Split banner is not visible.

### F5. Banner does not appear when already in stream mode
Steps:
1. Enter stream mode (e.g. use `/new` command).
2. Ensure split markers exist in the surface document.
Expected:
- Execute Split banner is not visible.

---

## G) Execute Split — Full Flow

### G1. Execute split opens stream authoring session
Steps:
1. With at least one split marker in the document, click **Execute split** in the banner.
Expected:
- Brief loading state on the button.
- Editor content updates: segmentBoundary divider(s) appear between the original piece segment and the new piece segment(s).
- Stream mode is now active (stream authoring UI visible — e.g. artifact labels, boundary handles).

### G2. New piece content is in the correct segment
Steps:
1. Write "Part A" before a split marker and "Part B" after.
2. Click **Execute split**.
Expected:
- First segment shows "Part A".
- Content after the boundary shows "Part B" (attributed to the new piece).

### G3. Error feedback on failure
Steps:
1. Remove the working copy (or engineer a scenario where the API returns 400).
2. Click **Execute split**.
Expected:
- Error message appears in the banner (e.g. "No split markers found. Please try again.").
- Editor content is unchanged.

---

## H) Statistics Panel — Suggest Splitting Toggle

### H1. Toggle disabled without a goal
Steps:
1. Ensure Word Count Goal is empty.
Expected:
- "Suggest splitting docs" checkbox/toggle is disabled or grayed.

### H2. Toggle enabled when goal is set
Steps:
1. Set a Word Count Goal.
Expected:
- "Suggest splitting docs" toggle becomes interactive.

### H3. Toggle state reflects backend value
Steps:
1. Decline a split suggestion ("Keep as one piece").
2. Open Statistics panel.
Expected:
- "Suggest splitting docs" is unchecked/off.

---

## Deliverables

- Screenshot of Statistics panel with Word Count Goal and Suggest splitting controls.
- Screenshot of over-target triangle indicator next to word count.
- Screenshot of split suggestion callout (initial state).
- Screenshot of split suggestion callout expanded with rationale boxes.
- Screenshot of split marker in document (manual, no title).
- Screenshot of split marker with title label.
- Screenshot of AI split marker with rationale italic.
- Screenshot of Execute Split banner ("1 split marker in this piece").
- Screenshot of editor after execute split (segmentBoundary node visible between segments).

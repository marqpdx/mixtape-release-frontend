# Editor's Desk — Issue Layout drag and drop

## Scope

Issue article rows now accept drops across their full height: the upper half inserts before the article, and the lower half inserts after it. A theme-colored line marks the insertion edge. Handles are larger and support touch dragging without scrolling from the handle; article links and other row controls remain separate. The existing gap targets, up/down buttons, and reorder API are retained.

## Lightweight verification — 2026-10-13

- Scoped ESLint and Mixtape TypeScript (`--noEmit --incremental false`): passed.
- Scratch runner `/tmp/issue-layout-drag-check.cjs`: passed. It extracts the actual row component, collision detector, and drag-end handler from `EditorsDeskWorkArea.tsx`, with mocked hooks/mutations and the real dnd-kit `pointerWithin` detector.
- Checked row-half targets take priority over the containing Issue panel; before/after insertion indices; fixed row geometry; touch handle configuration; upward, downward, and end moves; adjacent no-op, cancelled, and cross-Issue drops; save failure feedback; and inserting an unassigned article before a target row.
- These checks do not exercise a browser or live persistence. No backend changes or tests were needed.

## Deployment check

1. Open an Issue with at least three articles in Editor's Desk's editing view.
2. Drag the first article's handle onto the lower half of the last row; verify the insertion line, then drop.
3. Drag it back onto the upper half of the first row. Reload and verify the saved order.
4. Check the up/down buttons, article opening, lead toggle, and an unassigned article dropped into the middle.
5. On a touch device, drag by the handle and verify scrolling still works elsewhere in the row.

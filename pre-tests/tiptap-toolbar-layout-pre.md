# TipTap toolbar layout and writer help

## Changes

The fixed-height MainEditor now gives the toolbar and document separate space using a flex column. The solo and collaborative editor frames let the document fill the remaining space instead of adding the toolbar above a document that already occupied almost the entire frame. Toolbar padding is owned by `.ttb-toolbar`, with matching top/bottom theme spacing and no extra padding on the editor frame.

Writing Help is available to every writer through the question-mark button. It includes the Mac and Windows/Linux paragraph and Heading 1–4 shortcuts, Markdown heading input, Command/Option notation, and the collaborative editor's additional H5/H6 shortcuts. The help panel has its own bounded scroll area.

## Verification — 2026-10-14

- Scoped ESLint and Mixtape TypeScript (`--noEmit --incremental false`): passed.
- Chromium fixture with the actual `TipTapToolbar`, actual Chakra/Prose components, and layout JSX extracted directly from `MainEditor`, `TipTapEditor`, and `TipTapCollabEditor`: passed.
- Checked solo/collaborative frame layouts before and after focusing the end of a long document, typing, and scrolling. Toolbar position and theme spacing stayed stable; containing frames retained zero scroll offset.
- Checked shortcut table and explanatory help without an authenticated superuser role, plus Gist hiding/restoring the toolbar. No browser runtime errors.
- Scratch fixture: `/tmp/gp10-issue-check/app/toolbar/page.tsx`; runner: `/tmp/gp10-issue-check/toolbar-check.cjs`. The fixture uses a normal TipTap document in both frame layouts; it does not exercise Yjs synchronization or the full authenticated app. Temporary server stopped.
- Live verification remains: load a long writing piece, focus and type near its end, scroll the text, and confirm the toolbar padding stays consistent. Open Writing Help in both solo and collaborative editing.

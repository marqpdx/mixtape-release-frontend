# Writing Attic — first implementation

## Scope and storage

`writing.AtticEntry` is the only new model, linked to `WritingPiece`. It holds a ProseMirror selection slice (including open edges), plain text, source title/context, creator, and timestamps. It is separate from both manuscript bodies and Scrap. No Scrap behavior or public writing serializer was changed.

`GET/POST /api/writing/pieces/{id}/attic` requires authentication and the existing `CanEditWritingPiece` permission. Entries belong to the piece and are shared with its authorized editors. Capture IDs are client-generated UUIDs; an identical retry returns the saved entry, while an ID reused for different content returns 409.

The toolbar offers **Move selection to Attic** and **Attic**. Capturing saves the selection first, then cuts it through the editor's normal transaction/autosave path. These are two steps, not one database transaction. If capture fails, no cut occurs. If the document changes during capture or its editor unmounts, the entry is saved but the passage is not cut. A failed subsequent draft autosave may leave the original in the persisted manuscript; the Attic copy remains safe.

**Insert at cursor** uses the stored slice and retains the entry. Undo uses the editor's existing history. The shared controls cover Draft Room (including Editor's Desk), Focus Edit, Write Page, the composer (solo and collaborative), and the dual-panel target editor. Gist hides the toolbar as before. Read-only editors can browse entries when their toolbar is available but cannot move or insert; server access still requires edit permission.

## Lightweight verification — 2026-10-13

- Scoped ESLint for all edited frontend components: passed.
- Mixtape TypeScript (`--noEmit --incremental false`): passed.
- Six `writing.tests.test_attic_api` tests against the local test database: passed after correcting the test fixtures to set the required sponsor. The test database applied migration `0039_attic_entry`; the normal local database was not migrated.
- Backend checks cover rich formatting/provenance, unchanged draft and canonical bodies, retry idempotence/conflicts, authentication, cross-piece isolation, hidden soft-deleted entries, group editor access, ordinary member denial, and invalid selection rejection.
- Scratch `/tmp/attic-editor-check.cjs` loads the actual `AtticControls` with mocked UI/network hooks and real ProseMirror schema, slices, state, and history. Passed save-before-cut, bold reinsertion, retry ID reuse, failure preservation, Undo, concurrent editing/unmount safety, empty selection, and nested multi-paragraph capture.
- No browser or live checks yet. No migration applied to production by this session, and nothing deployed. Backend and frontend commit identifiers are provided in the accompanying commit handoff.

## Deployment and manual check

1. Deploy backend and apply `writing.0039_attic_entry` before deploying frontend.
2. In Draft Room, select a formatted paragraph and use **Move selection to Attic**. Verify the save confirmation and that the manuscript cut autosaves.
3. Open **Attic**, verify the saved formatting/source/date, then place the cursor and **Insert at cursor**. Verify Undo and that the Attic copy remains.
4. Reload or switch pieces and back; verify persistence and separation between pieces.
5. Repeat in Editor's Desk and Focus Edit. Test a nested list or dialogue block and a partial paragraph.
6. Simulate a failed Attic POST: the manuscript must remain unchanged. Edit during a delayed POST: the entry should save without cutting the changed manuscript.
7. Verify an ordinary group member/public reader cannot access Attic entries. Publish a piece and confirm the public body contains only manuscript content, not Attic entries.

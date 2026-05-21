---
title: Writing — Suggested Revisions Technical Reference
subsystem: writing
area: suggested-revisions-tech
excerpt: Technical reference for non-destructive writing analysis, sibling suggested revisions, and fidelity reports.
routes:
  - /api/writing/pieces/{id}/analysis/export
  - /api/writing/pieces/{id}/analysis/sessions/{session_id}/create-revision
workAreas:
  - WriteComposer
  - OutlineDrawer
tags:
  - writing
  - analysis
  - revision
  - fidelity
  - technical
---

# Writing — Suggested Revisions Technical Reference

---

## For admins

### What this feature does

Suggested revisions provide a non-destructive analysis workflow for writing drafts:

1. export the current mutable draft into a structured analysis payload
2. persist an analysis session
3. create a sibling draft instead of mutating the source draft
4. persist explicit lineage between source and suggested draft
5. generate a fidelity report explaining the relationship between them

This feature is intentionally additive. It does not alter the core meaning of `WritingPiece` or `WorkingDocument`.

### Current admin expectations

There are no special tenant-level admin controls yet beyond the normal ability to edit writing. The current UI assumes that a user who can edit a piece can also create a suggested revision for it.

### Permissions and roles

| Role | Access |
|------|--------|
| Author | Can export analysis and create suggested revisions for their own writing. |
| Dispatch collaborator with edit access | Can pass the `CanEditWritingPiece` gate and use the same analysis endpoints. |
| Group editor/steward/admin with writing edit permission | Can use the workflow on group-sponsored pieces they are allowed to edit. |
| Reader / non-editor | No access. |

The backend gate is the same `CanEditWritingPiece` permission used by the draft editing surface.

---

## API reference

All endpoints require authentication.

### Writing analysis export

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/writing/pieces/{piece_id}/analysis/export` | Creates a `WritingAnalysisSession` and returns a `WritingAnalysisExport v1` payload for the current mutable draft state. |

**Request body:**

- `planner_type` — string, optional — planner mode label such as `hybrid`
- `planner_label` — string, optional — descriptive label for the planner implementation

**Response fields:**

- `session` — persisted session metadata
- `export` — `WritingAnalysisExport v1`

### Suggested revision creation

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/writing/pieces/{piece_id}/analysis/sessions/{session_id}/create-revision` | Creates a sibling draft from the analysis session and returns lineage plus fidelity data. |

**Request body:**

- `title_suffix` — string, optional — defaults to `Suggested Revision`

**Response fields:**

- `suggested_revision` — persisted lineage record
- `fidelity_report` — persisted fidelity artifact
- `piece` — the new sibling `WritingPiece`

**Idempotency behavior:**

If a suggested revision already exists for the session, the endpoint returns the existing revision and associated report instead of creating another.

---

## Data model notes

### Core writing models remain unchanged

The implementation explicitly keeps:

- `WritingPiece` as the canonical authored content model
- `WorkingDocument` as the mutable editing layer

No general metadata blob was added to either model for this workflow.

### `WritingAnalysisSession`

Purpose:

- root coordination record for one export/analyze cycle
- stores source revision hash
- stores export payload
- optionally stores suggestion payload/warnings
- tracks lifecycle state such as `exported`, `ready`, `imported`, `stale`, `failed`

Key fields:

- `source_piece`
- `created_by`
- `source_revision_hash`
- `export_version`
- `planner_type`
- `planner_label`
- `status`
- `export_payload`
- `suggestion_payload`
- `warnings`

### `WritingSuggestedRevision`

Purpose:

- explicit lineage record between the source draft and the non-destructive sibling draft

Key fields:

- `source_piece`
- `suggested_piece`
- `analysis_session`
- `source_revision_hash`
- `derivation_type`
- `created_by`

### `WritingFidelityReport`

Purpose:

- persisted structured artifact describing changes between the source draft and the sibling revision

Key fields:

- `analysis_session`
- `suggested_revision`
- `source_piece`
- `suggested_piece`
- `source_revision_hash`
- `report_version`
- `report_payload`

---

## Export model notes

The current implementation exports the mutable draft state by preferring `WorkingDocument` content over `WritingPiece.body_json` when a working copy exists. This matches how draft editing already works elsewhere in the writing system.

The export payload is block-based:

- each top-level TipTap node becomes a block
- inline formatting is preserved inside `node_json`
- headings and persistent outline nodes are exported as structural signals
- normalized markdown and plain text are derived convenience views, not the authority

`block_id` is the primary structural anchor for the exported analysis shape.

---

## Frontend integration notes

The first frontend integration lives in the writing outline drawer:

- `packages/api/src/clients/writing/writingApi.ts`
- `apps/mixtape/src/components/writing/outline/OutlineDrawer.tsx`
- `apps/mixtape/src/components/writing/WriteComposer.tsx`

The first UI slice is intentionally narrow:

- analyze current draft
- create suggested revision
- show compact fidelity summary
- open the suggested draft route

This is not yet a full side-by-side review environment.

---

## Known gotchas

- **Suggested revision currently uses the exported draft body:** the current backend vertical slice creates the sibling draft from the stored export payload. The richer “approved suggestion payload” path is still part of the next UX/deeper-planning step.
- **Fidelity reporting is still compact:** the first report is structured and persisted, but not yet a full visual comparison tool.
- **Frontend sanity check was inconclusive in-agent:** a `tsc --noEmit` run was started against the Mixtape app workspace but did not complete in a reasonable window in-session. Use the normal local frontend check flow before release.
- **DB-backed tests were not run in-agent:** backend syntax/import checks passed, but Django test execution was blocked in the agent sandbox because Postgres on `localhost:5433` was not reachable there.
- **Migration numbering matters:** the analysis/revision/fidelity migrations were linearized to avoid a merge migration in `writing`. Keep the chain as:
  - `0021_writinganalysissession`
  - `0022_writingsuggestedrevision`
  - `0023_rename_...`
  - `0024_writingfidelityreport`

---

## Related libraries / services

- **writing.analysis_export** — builds `WritingAnalysisExport v1` payloads and source revision hashes
- **writing.suggested_revision** — creates sibling drafts and lineage records
- **writing.fidelity_report** — generates and persists `WritingFidelityReport`
- **dispatch.DispatchOutlineNode** — exported as persistent outline metadata
- **TipTap / ProseMirror** — source document model used for block export
- **React Query** — used in the frontend drawer for mutation state

---
title: Puddlejump — Technical Reference
subsystem: puddlejump
area: overview-tech
excerpt: Technical reference for Puddlejump. Covers the Canon Library model, document lifecycle, audit trail, and integration with group governance.
routes:
  - /puddlejump
  - /puddlejump/*
workAreas: []
tags:
  - puddlejump
  - documents
  - admin
  - technical
---

# Puddlejump — Technical Reference

---

## For admins

### Approve a document as Canon

- Precondition: You must be a Group Admin or have the `canApproveCanon` permission.
- Select a document and choose Approve as Canon.
- Once approved, the document enters version tracking — all future edits are logged.
- Note: Approval triggers ingestion for all pending files in the library, not just the approved file (see Known Gotchas).

### Export the Canon Library

- Trigger an export from your group's Puddlejump admin section.
- Produces a zip file downloaded directly in the response (not a cloud link).
- Export always reflects the latest Canon version of each document.

### Review canonical candidates

- The system surfaces documents close to ready for Canon approval.
- Use the Canonical Candidates view to queue them for review.

---

## API reference

All endpoints require authentication. Access is restricted to library members — personal library: sponsor only; group library: admin or owner via group membership.

Base path: `/api/stackroom/puddlejump/`

### Sync (desktop upload)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `.../sync/upload/` | Upload a bundle from a desktop client |
| POST | `.../sync/status/` | Check sync status |

Bundle constraints: max 50MB total, 5MB per file, 300 files, Markdown only. SHA-256 hashes required. No absolute paths or path traversal.

### Canon management

| Method | Route | Description | Permission |
|--------|-------|-------------|------------|
| GET | `.../canon/versions/{library_id}/` | List version history for a library | Library member |
| POST | `.../canon/versions/{library_id}/` | Create a new version | Library member |
| GET | `.../canon/diff/{library_id}/` | Diff between versions | Library member |
| POST | `.../canon/checkout/{library_id}/` | Check out a document | Library member |
| POST | `.../canon/checkin/{library_id}/` | Check in a document | Library member |
| GET | `.../canon/export/{library_id}/` | Export Canon library as streaming zip | Admin/owner |
| GET | `.../canon/status/{library_id}/` | Library status summary | Library member |
| POST | `.../canon/approve/{library_id}/` | Approve document as Canon | `canApproveCanon` |

### Utility

| Method | Route | Description |
|--------|-------|-------------|
| GET | `.../candidates/{library_id}/?top_n={n}` | List canonical candidates (n: 1–100) |

---

## Known gotchas

- **Approval triggers batch ingestion (S8 — open):** When a document is approved as Canon, ingestion is triggered for all pending files in the library — not just the approved file. Per-file ingestion targeting is a future improvement.
- **No hard locking:** Checkout is advisory. Concurrent edits are possible; all changes are recorded but conflicts are not prevented.
- **Export is a streaming zip:** The export endpoint streams the zip file directly in the HTTP response — it does not return a signed URL. Clients must handle streamed binary responses.
- **Bundle limits are hard:** Bundles exceeding 300 files or 50MB are rejected with `ERR_BUNDLE_TOO_LARGE`. No partial imports.
- **`canApproveCanon` is grantable:** This permission can be granted to non-admin users via the identity/permissions system — it is not admin-only.

---

## Switchboard Generate endpoints (authenticated users)

Phase 3 verbs are available from the Puddlejump Generate sidebar. All produce ActionRun records. Cloud paths require the `initiatives.approve_cloud_dispatch` permission.

| Method | Route | Tool name | Local | Cloud | Notes |
|--------|-------|-----------|-------|-------|-------|
| POST | `/api/switchboard/draft` | `puddlejump.draft` | IsAuthenticated | `approve_cloud_dispatch` | Content type, tone, length, approval mode in payload |
| POST | `/api/switchboard/refine` | `puddlejump.refine` | IsAuthenticated | `approve_cloud_dispatch` | Input text + style instruction |
| POST | `/api/switchboard/add` | `puddlejump.add` | IsAuthenticated | — | Synchronous; no LLM |
| POST | `/api/switchboard/find` | `puddlejump.find` | IsAuthenticated | — | Semantic IR; synchronous |
| POST | `/api/switchboard/research` | `puddlejump.research` | IsAuthenticated | — | Always LOCAL |
| POST | `/api/switchboard/pattern` | `puddlejump.pattern` | IsAuthenticated | — | Pattern detection |
| POST | `/api/switchboard/synthesize` | `puddlejump.synthesize` | IsAuthenticated | — | Multi-input narrative merge |

`tool_name` surface prefix distinguishes Puddlejump-triggered calls from the same verbs triggered by Console (`console.*`). The backend uses the surface prefix to route `on_action_run_saved` writeback correctly.

---

## Utilities endpoints

Utilities are read-only analysis tools. All require authentication; access is restricted to library members.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/puddlejump/utilities/duplicates/{library_id}/` | Similarity analysis across library files |
| GET | `/api/puddlejump/utilities/glossary/{library_id}/` | Term extraction across library files |
| GET | `/api/puddlejump/utilities/canonical/{library_id}/` | Canon-readiness candidates |
| POST | `/api/puddlejump/utilities/summaries/{library_id}/` | AI-assisted summary suggestions |
| GET | `/api/puddlejump/utilities/restructure/{library_id}/` | Reorganization suggestions |

Utilities do not write to library documents. They return suggestion payloads only.

---

## Related services

- **Stackroom ingestion** — Canon exports feed the Stackroom processing pipeline. Ingestion is triggered automatically on Canon approval.
- **Identity** — The `canApproveCanon` permission is managed via Mixtape's identity/permissions system.
- **Switchboard** — Generate verbs route through the Switchboard worker queue (`switchboard` queue). See ADR-0045 §6 for the full permission table and approval mode policy.

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

## Related services

- **Stackroom ingestion** — Canon exports feed the Stackroom processing pipeline. Ingestion is triggered automatically on Canon approval.
- **Identity** — The `canApproveCanon` permission is managed via Mixtape's identity/permissions system.

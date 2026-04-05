---
title: Writing — Technical Reference
subsystem: writing
area: overview-tech
excerpt: Technical reference for the Writing system. Covers the Seed model, Draft Room, publication controls, and integration with Inkwell.
routes:
  - /writing
  - /writing/*
  - /drafts
  - /drafts/*
workAreas:
  - SponsorWritingWrapper
  - WritingEditorWrapper
  - SeedsWorkArea
  - DraftRoomWorkArea
tags:
  - writing
  - drafts
  - seeds
  - technical
---

# Writing — Technical Reference

---

## For admins

### Managing writing in a group context

Group writing is sponsored via the `WritingPiece.sponsor` GFK (pointing to the `Group` model). Admins and stewards with `edit_course` permission (see Known Gotchas) can edit group-sponsored writing pieces. `publish_course` permission is required to publish.

The Django admin exposes `WritingPiece`, `WorkingDocument`, `WritingVersion`, `Seed`, `WorkSession`, `WorkSessionItem`, and `WritingSurfaceDocument`.

### Pinning writing

Group admins can pin a piece to the top of the feed:
```http
POST /api/writing/pieces/{piece-id}/pin
{ "rank": 1 }
```
Pinning sets `pinned_at` (timestamp) and optionally `pinned_rank`. The default ordering for `WritingPiece` is `[-pinned_at, -published_at, -updated_at]`.

### Permissions and roles

| Role | Can edit own writing | Can publish own writing | Can edit group writing | Can publish group writing |
|------|---------------------|------------------------|------------------------|--------------------------|
| Author (owner) | Yes | Yes | N/A | N/A |
| Group Admin/Steward | N/A | N/A | Yes (via `edit_course` proxy) | Yes (via `publish_course` proxy) |
| Group Member | N/A | N/A | No | No |

**Known gap**: `CanEditWritingPiece` and `CanPublishWritingPiece` use `edit_course` and `publish_course` as a temporary proxy until `edit_writing` and `publish_writing` are added to the permission registry. See Known Gotchas.

---

## API reference

All endpoints require authentication unless noted. Base path: `/api/writing/`

### Writing Pieces

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/pieces` | List authenticated user's pieces. Filters: `status`, `writing_kind`, `pinned_only`. |
| POST | `/pieces` | Create a piece. Pass `create_working_copy: true` to also create a `WorkingDocument`. |
| GET | `/pieces/{id}` | Get piece detail by UUID. |
| PATCH | `/pieces/{id}` | Update piece fields. |
| DELETE | `/pieces/{id}` | Soft-delete piece. |
| GET | `/pieces/view/{slug}` | **AllowAny** — Get a published piece by slug for public viewing. Resolves via `ContentPlacement`. |
| PUT | `/pieces/{id}/working-copy` | Upsert autosave buffer (`WorkingDocument`). |
| GET | `/pieces/{id}/working-copy` | Get current autosave buffer. |
| POST | `/pieces/{id}/apply-working-copy` | Merge working copy into canonical piece; snapshots a new version if published. |
| POST | `/pieces/{id}/publish` | Full publish-and-place: accepts `destinations`, `placement_options`, `group_overrides`. |
| POST | `/pieces/{id}/schedule` | Schedule a piece. Requires `scheduled_for` (ISO8601). |
| POST | `/pieces/{id}/unpublish` | Return to draft. |
| POST | `/pieces/{id}/pin` | Pin piece. Optional `rank` integer. |
| POST | `/pieces/{id}/unpin` | Unpin piece. |
| PATCH | `/pieces/{piece-id}/clear-empty` | Clear `is_empty` flag. Requires auth + authorship. |

**Publish destinations payload structure:**
```json
{
  "destinations": {
    "personal": true,
    "groups": ["group-slug-or-uuid"],
    "shelves": ["library-uuid"],
    "lantern": false
  },
  "placement_options": {
    "visibility": "public",
    "follow_updates": false
  },
  "group_overrides": {
    "group-slug-1": { "visibility": "members" }
  },
  "audience": "readers",
  "addressed_to": "public"
}
```

### Seeds

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/seeds` | List authenticated user's seeds. |
| POST | `/seeds` | Create seed. Accepts JSON or multipart (for voice). |
| POST | `/seeds/ingest` | Ingest a seed from external sources (share target, browser extension). |
| GET | `/seeds/{id}` | Get seed detail. |
| PATCH | `/seeds/{id}` | Update seed (autosave). |
| DELETE | `/seeds/{id}` | Delete seed. |
| POST | `/seeds/{id}/promote` | Promote seed → `WorkingDocument` linked to a new `WritingPiece`. |
| POST | `/seeds/{id}/promote-to-leaf` | Promote seed → `Leaf` (Storyline). |

**Voice seed upload (multipart):**
```
kind=voice
audio_file=<blob>      # max 20MB; must be audio/* or video/webm
source=web
```
Response includes `status: "processing"`. Transcription is async via Celery. Poll `GET /seeds/{id}` until `status` is `"ready"` or `"failed"`.

### Work Sessions

All work session endpoints are under `/api/work-sessions/`.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List user's active sessions. |
| POST | `/` | Create session. Body: `{ anchor_content_type_model, anchor_object_id }`. |
| GET | `/{id}/` | Session detail. |
| PATCH | `/{id}/` | Update. Pass `{ "end": true }` to close the session (runs final checkpoint). |
| DELETE | `/{id}/` | Soft-delete session. |
| GET | `/{id}/items/` | List session items. |
| POST | `/{id}/items/` | Add item. Body: `{ content_type_model, object_id }`. |
| DELETE | `/{id}/items/{item-id}/` | Remove item (soft-delete). |
| GET | `/{id}/surface/` | Get `WritingSurfaceDocument`. |
| PUT | `/{id}/surface/` | Autosave surface. Body: `{ body_json, client_session_id? }`. |
| POST | `/{id}/checkpoint/` | Trigger checkpoint extraction (walks boundary nodes, updates artifact drafts). |

---

## Data model notes

### WritingPiece

Key fields for integrators:
- `status`: `draft | scheduled | published | archived`
- `writing_kind`: `post | article | dispatch | forum | announcement | almanac | page | other`
- `body_json`: TipTap/ProseMirror JSON
- `addressed_to`: `public | crossroads | self`
- `is_empty`: auto-managed on save based on `body_json` content
- `reading_time`: auto-calculated from word count on save (200 wpm)
- `sponsor_content_type` / `sponsor_object_id`: GFK — `Group` or `User`

### WorkingDocument (autosave buffer)

- One per `(piece, user)` pair
- `unique_together = [("piece", "user")]`
- `apply_to_piece()` merges title, excerpt, body_json into the canonical `WritingPiece`
- `dispatch_content` FK links to collaborative (Yjs) editing if enabled

### WritingVersion (immutable snapshot)

- Created at publish time via `create_version()`
- `kind='release'` for published artifacts
- `sequence_no` increments per piece

### Seed

- `kind`: `text | voice`
- `status`: `ready | processing | failed`
- `audio_file` FK → `StoredFile` (files app)
- `transcript_text`: raw transcript; `body_text` is the canonical display field (populated from transcript on success)
- `promoted_to` OneToOne → `WorkingDocument`

### WorkSession / WritingSurfaceDocument

- `WorkSession.surface_document` OneToOne → `WritingSurfaceDocument`
- `WritingSurfaceDocument.body_json`: full TipTap document including `segmentBoundary` nodes
- Segment parsing is done at runtime in `checkpoint_extraction()` by walking `body_json.content` for nodes with `type == "segmentBoundary"`
- Anchor segments are merged; emitted segments are extracted per artifact type via body adapters

---

## Known gotchas

- **Shelf ownership not enforced at publish**: The `publish_and_place()` service shelf placement loop does `Library.objects.filter(id__in=shelf_ids)` with no check that the requesting user owns or has permission to place content into those shelves. Any authenticated author can place their piece into any shelf whose UUID they know. **[DECISION NEEDED]** — policy decision pending on whether shelf placement should require shelf ownership or membership.

- **`WritingPiecePublicView` visibility bypass**: Currently any published piece is accessible via `GET /api/writing/pieces/view/{slug}` regardless of placement visibility. **[RESOLVED]** — policy decision: any published `WritingPiece` is publicly accessible by slug. No change needed.

- **`str(e)` in publish errors**: Fixed. The publish-and-place 500 handler previously returned raw exception strings. Now logs internally and returns a generic message.

- **`clear_empty_flag` auth**: Fixed. Previously unauthenticated. Now requires authentication and ownership.

- **Publish-and-place logic**: Extracted from view into `writing/publish_service.py::publish_and_place()`. The view (`WritingPiecePublishAndPlaceView`) is now a thin dispatcher — all business logic lives in the service under `@transaction.atomic`.

- **Voice audio file size limit**: 20MB hard limit (`MAX_SEED_AUDIO_BYTES`). Allowed MIME types: `audio/*` prefix or `video/webm`. Browser-recorded audio (WebM format) is explicitly allowed.

---

## Related libraries / services

- **publishing** — `ContentPlacement` is the universal placement model used by the publish-and-place endpoint.
- **files** — `StoredFile` is used by voice seeds for audio storage.
- **stackroom** — `Library` (shelves) model lives here; used by writing's shelf placement logic.
- **dispatch** — Collaborative editing (Yjs) integrates via `WorkingDocument.dispatch_content` FK.
- **groups** — `PermissionService` is called for group-sponsored writing permission checks.
- **Celery** — `transcribe_seed_task` runs async transcription for voice seeds.

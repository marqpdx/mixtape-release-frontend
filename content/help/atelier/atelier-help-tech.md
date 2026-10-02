# Atelier — Technical Reference

Atelier is a Django app (`atelier`) that provides the intermediate shaping layer between writing and publishing for `WritingPiece`. It adds no new primary models — it wraps existing infrastructure (`ClassificationUsage`, `WritingSynopsis`, `WritingSeries`) behind a dedicated API and computes a `CraftReadiness` object on demand.

---

## For admins

### Access control

All Atelier endpoints are author-only. The `_get_piece_for_author(slug, user)` helper in `atelier/api/views.py` enforces that `piece.author == request.user`. There is no admin-accessible Atelier surface — manage tags, categories, and synopses via the Django admin for their respective models (`classifications`, `writing`).

### Permissions and roles

| Role | Access |
|------|--------|
| Author (piece owner) | Full read/write on all Atelier endpoints for their own pieces |
| Any other authenticated user | No access — 403 on all endpoints |
| Unauthenticated | No access — 401 |

---

## API reference

All endpoints require authentication. Base prefix: `/api/atelier/`.

### Readiness

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/atelier/{piece_slug}/readiness/` | Computed craft readiness for a piece |

**Response fields:**

- `tags` — `"untouched" | "partial" | "confirmed" | "deferred"`
- `category` — same states
- `summaries` — same states
- `series` — same states
- `relations` — always `"deferred"` in Phase 1
- `overall` — same states; worst-case aggregate

Readiness is computed on each request — not stored. `"untouched"` = nothing present. `"partial"` = some present but none confirmed. `"confirmed"` = at least one confirmed. `"deferred"` = Phase 2 feature, not applicable yet.

---

### Tags

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/atelier/{piece_slug}/tags/` | List tags on the piece |
| POST | `/api/atelier/{piece_slug}/tags/` | Add a tag by ID |
| DELETE | `/api/atelier/{piece_slug}/tags/{cu_id}/` | Remove a tag (by ClassificationUsage UUID) |
| GET | `/api/atelier/tags/search/?q=` | Search all tags by name |

**POST body:**
- `tag_id` — UUID of the `Tag` to add

**Tag object fields (in list and search responses):**
- `cu_id` — UUID — the `ClassificationUsage` join record ID (use this for DELETE)
- `id` — UUID — the `Tag` model ID
- `name` — string
- `slug` — string

**Note:** The `tags/search/` route must appear before `<slug:piece_slug>/` patterns in `urls.py` to prevent `"tags"` being parsed as a piece slug. This is already handled in `atelier/api/urls.py`.

---

### Category

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/atelier/{piece_slug}/category/` | Get current category (or null) |
| PUT | `/api/atelier/{piece_slug}/category/` | Set category (replaces any existing) |
| DELETE | `/api/atelier/{piece_slug}/category/` | Remove category |

**PUT body:**
- `category_id` — UUID of the `Category` to set

**Category object fields:**
- `cu_id` — UUID — `ClassificationUsage` ID
- `id` — UUID — `Category` model ID
- `name` — string
- `slug` — string

A piece can have one primary category. PUT removes any existing category and adds the new one atomically.

---

### Summaries

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/atelier/{piece_slug}/summaries/` | Get all three summaries |
| PATCH | `/api/atelier/{piece_slug}/summaries/` | Update one or more summary fields |
| POST | `/api/atelier/{piece_slug}/summaries/confirm/` | Confirm one or more summary types |

**Summary object (GET/PATCH response):**
```json
{
  "public_synopsis":       { "text": "...", "confirmed": false },
  "linkedin_introduction": { "text": "...", "confirmed": false, "extended": { "source_claim": "...", "human_stake": "..." } },
  "internal_notes":        { "text": "...", "confirmed": false }
}
```

**PATCH body** — any subset of:
- `public_synopsis` — string
- `linkedin_introduction` — string
- `internal_notes` — string

Patching creates `WritingSynopsis` via `get_or_create` if it doesn't exist.

**POST /confirm/ body:**
- `types` — list of `"public_synopsis" | "linkedin_introduction" | "internal_notes"`

**Field mapping to `WritingSynopsis`** (wire keys renamed 2026-10 for UI clarity; DB columns unchanged):

| Atelier wire key | `WritingSynopsis` DB field |
|---------------|---------------------------|
| `public_synopsis` | `description` |
| `linkedin_introduction` | `linkedin_copy` (was wire key `linkedin_synopsis`) |
| `internal_notes` | `internal_abstract` (added in migration 0020; was wire key `internal_abstract`) |
| `public_synopsis` confirmed flag | `public_synopsis_confirmed` |
| `linkedin_introduction` confirmed flag | `linkedin_synopsis_confirmed` |
| `internal_notes` confirmed flag | `internal_abstract_confirmed` |

`linkedin_introduction.extended` surfaces `WritingSynopsis.linkedin_copy_extended` (hook/short_synopsis/one_line_takeaway/alt_hook/source_claim/human_stake) so the UI can show "Why this angle" (source_claim, human_stake) alongside the generated copy.

**Do not touch:** `WritingSynopsis.teaser` and `WritingSynopsis.excerpt` — these are owned by `synopsis_service.py` and populated at publish time from `WritingPiece.excerpt`.

---

### Series

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/atelier/{piece_slug}/series/` | Get current series + available series |
| PUT | `/api/atelier/{piece_slug}/series/` | Assign piece to a series |
| DELETE | `/api/atelier/{piece_slug}/series/` | Remove series assignment |
| GET | `/api/atelier/{piece_slug}/series/search/?q=` | Search available series by title |

**GET response:**
```json
{
  "current": { "id": "...", "title": "...", "slug": "..." } | null,
  "available": [ { "id": "...", "title": "...", "slug": "..." } ]
}
```

**PUT body:**
- `series_id` — UUID of the `WritingSeries` to assign

Available series are scoped to the piece's `group` FK. A piece without a group sponsor will have an empty available list.

---

## Data model notes

### `WritingSynopsis` (writing app)

The four fields added for Atelier (migration `writing/0020_writingsynopsis_atelier_fields.py`):

```python
internal_abstract = TextField(blank=True, default="")
public_synopsis_confirmed = BooleanField(default=False)
linkedin_synopsis_confirmed = BooleanField(default=False)
internal_abstract_confirmed = BooleanField(default=False)
```

`WritingSynopsis` is a `OneToOneField` on `WritingPiece` (`related_name="synopsis"`). Access via `piece.synopsis` — may not exist; use `get_or_create`.

### `ClassificationUsage` (classifications app)

Tags and categories are attached via this GFK join model. Key field names:

- Client (the piece): `classification_client_content_type` / `classification_client_object_id`
- Classifier (the tag or category): `classification_content_type` / `classification_object_id`

`BaseContent.add_classification(tag_or_category)` returns a single `ClassificationUsage` instance (not a tuple). `remove_classification(tag_or_category)` decrements usage and deletes the record if count reaches zero.

### `WritingSeries` (writing app)

UUID PK. `group` FK is optional but used for scoping available series in Atelier. `WritingPiece.series` is a nullable FK to `WritingSeries`.

---

## Publish flow integration

`WritingPiecePublishAndPlaceView.post()` (`writing/api/views.py`) calls `get_readiness_warnings(piece)` from `atelier.services` before `publish_and_place` and includes the result in the response:

```json
{
  "readiness_warnings": ["No tags have been added to this piece.", "..."]
}
```

This is warn-not-block. The frontend (`SimplePublishDialog.tsx`) separately fetches `GET /api/atelier/{slug}/readiness/` when the dialog opens and renders warnings as a yellow callout before the audience selector. The publish action is never gated on readiness.

---

## Known gotchas

- **`add_classification` returns a single instance.** It is not a tuple. Do not unpack with `usage, _ = piece.add_classification(...)`.
- **`tags/search/` URL ordering.** This route must be registered before `<slug:piece_slug>/` patterns or Django will match `"tags"` as a piece slug and 404.
- **No `WritingSynopsis` on new pieces.** Summaries GET returns nulls gracefully; PATCH uses `get_or_create`. Do not assume `piece.synopsis` exists.
- **Series scoping.** If a `WritingPiece` has no `group` FK set, `available` in the series response will be empty. This is expected — series are group-scoped.
- **Readiness is not cached.** Every call to `ReadinessView` or `get_readiness_warnings()` runs fresh queries. Acceptable for current load; revisit if it shows up in profiling.

---

## Related libraries / services

- **`classifications` app** — provides `Tag`, `Category`, `ClassificationUsage`; Atelier reads/writes via `BaseContent.add_classification` / `remove_classification`
- **`writing` app** — owns `WritingPiece`, `WritingSynopsis`, `WritingSeries`; Atelier wraps these without replacing them
- **`synopsis_service.py`** — generates `WritingSynopsis.teaser` at publish time from `WritingPiece.excerpt`; Atelier must never write to `teaser` or `excerpt`
- **`publishing` app** — `WritingPiecePublishAndPlaceView` is the publish entry point where AT-7 warning integration lives
- **`inkwell`** — AI suggestion pipeline; Phase 2 will route tag/summary suggestions through Inkwell → Switchboard

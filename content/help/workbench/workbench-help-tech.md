---
title: Workbench — Technical Reference
subsystem: workbench
area: overview-tech
excerpt: Technical reference for the Workbench. Covers the curation suite, content routing pipeline, and integration with Lighthouse submissions.
routes:
  - /workbench
  - /workbench/*
workAreas:
  - WorkbenchCurationWorkArea
tags:
  - workbench
  - curation
  - admin
  - technical
---

# Workbench — Technical Reference

---

## For admins

### Access model

Sponsor membership is enforced in the view layer via `_user_can_access_sponsor()`. There is an intentional two-level split:

| Operation | Required | How enforced |
|-----------|----------|--------------|
| List / queue drafts | Member+ of sponsor | `get_queryset` raises 403 |
| Retrieve draft detail | Member+ of sponsor | `check_object_permissions` via `get_object()` |
| Update (PATCH) draft | Member+ of sponsor | same |
| Validate draft | Member+ of sponsor | same |
| Any triage action | Steward+ of sponsor | explicit role check at top of `perform_action` |

**Reading the queue is member-visible** — anyone in the group can see what's in the hopper. **Acting on it** (open, approve, promote, archive, discard, reactivate) requires steward role or higher.

User-sponsored drafts always pass both levels — the user is their own owner.

Unauthorized access returns **403 Forbidden**, not 404 — intentional, to avoid leaking whether an ID is valid.

### Feedback item moderation

Update and delete actions on feedback items are superuser-only. Regular admins can view the feedback queue but cannot change item status via API directly — this is a known limitation pending a role-based feedback permission.

---

## API reference

All endpoints require authentication (`JWTAuthentication` or `OAuth2Authentication`) unless noted.

### MillDrafts — Review Queue

**Base path:** `/api/workbench/drafts/`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/workbench/drafts/` | List drafts (full, with filters) |
| POST | `/api/workbench/drafts/` | Create a draft manually |
| GET | `/api/workbench/drafts/{id}/` | Draft detail |
| PATCH | `/api/workbench/drafts/{id}/` | Edit draft content (active status only) |
| POST | `/api/workbench/drafts/{id}/perform-action/` | Apply a lifecycle action |
| POST | `/api/workbench/drafts/{id}/validate/` | Run validation |
| GET | `/api/workbench/drafts/queue/` | Candidates-only queue view |

**List / queue filters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sponsor_type` | string | `"user"` or `"group"` |
| `sponsor_id` | UUID | The sponsor's UUID |
| `status` | string | `candidate`, `active`, `ready_to_promote`, `archived` |
| `content_profile` | string | `writing`, `event`, `course`, etc. |
| `source_type` | string | `stackroom`, `concord`, `gristmill`, `copydesk`, `in_editor`, `manual` |

**Create fields (POST):**

```json
{
  "sponsor_type": "user|group",
  "sponsor_id": "uuid",
  "content_profile": "string",
  "title": "string",
  "summary": "string",
  "grist_body": "string",
  "ast": {},
  "source_type": "string",
  "source_id": "string",
  "author": "uuid",
  "author_name": "string"
}
```

**Edit fields (PATCH — active drafts only):**

```json
{
  "title": "string",
  "summary": "string",
  "grist_body": "string",
  "ast": {},
  "author_name": "string"
}
```

---

### MillDraft actions

**`POST /api/workbench/drafts/{id}/perform-action/`**

```json
{
  "action": "open|approve|promote|archive|discard|reactivate",
  "publish": false,
  "notes": ""
}
```

| Action | From status | To status | Creates audit entry |
|--------|------------|-----------|---------------------|
| `open` | `candidate` | `active` | No |
| `approve` | `candidate` | unchanged | Yes — `APPROVE` |
| `promote` | `ready_to_promote` | `promoted` | Yes — `PROMOTE` or `PROMOTE_AND_PUBLISH` |
| `archive` | any | `archived` | Yes — `ARCHIVE` |
| `discard` | any | soft-deleted | Yes — `DISCARD` |
| `reactivate` | `archived` | `active` | No |

`publish: true` on `promote` triggers immediate publication if the content profile's PSC allows it (PSC-1 or PSC-2). PSC-0 profiles block promotion entirely.

**Response:**
```json
{
  "message": "string",
  "draft": { ...full draft detail... }
}
```

---

### MillDraft validation

**`POST /api/workbench/drafts/{id}/validate/`**

```json
{ "hard": true }
```

`hard: false` = soft/quick check. `hard: true` = comprehensive (runs all field risk rules from the profile config).

**Response:**
```json
{
  "is_valid": true,
  "validation_state": {},
  "errors": [{ "field": "title", "message": "...", "severity": "..." }],
  "warnings": []
}
```

---

### Content profile configuration

**Base path:** `/api/workbench/profiles/`  (read-only)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/workbench/profiles/` | List all enabled profiles |
| GET | `/api/workbench/profiles/{name}/` | Profile detail by name |

Key fields: `profile_name`, `display_name`, `publish_safety_class` (`psc_0|psc_1|psc_2`), `required_fields`, `validation_schema`, `is_enabled`.

PSC determines promotion eligibility — `psc_0` blocks promotion, `psc_1` requires safety checks (title + grist_body + AST), `psc_2` always allows.

---

### Feedback items

**Base path:** `/api/feedback/`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/feedback/beacons/{key}` | None | Get beacon config |
| GET | `/api/feedback/items` | Required | List items (paginated) |
| POST | `/api/feedback/items` | None | Submit feedback (throttled by IP) |
| PATCH | `/api/feedback/items/{id}` | Superuser | Update status or message |
| DELETE | `/api/feedback/items/{id}` | Superuser | Delete item |
| GET | `/api/feedback/checklist` | Required | List as checklist view |
| GET | `/api/feedback/items/summary` | Superuser | Status count summary |

**List filters:** `kind` (`bug|request|idea|issue`), `status` (`new|sent_to_agent|triaged|planned|shipped|wontfix`), `page`, `page_size` (max 100).

**Update body (superuser):**
```json
{
  "status": "new|sent_to_agent|triaged|planned|shipped|wontfix",
  "message": "string"
}
```

---

## Data model notes

- `ReviewQueueEntry` — immutable audit log; one record per action on a draft. Multiple entries per draft are normal. Decision values: `DISCARD`, `APPROVE`, `PROMOTE`, `PROMOTE_AND_PUBLISH`, `ARCHIVE`.
- `MillDraftSuggestion` — provenance record linking a draft to its source system. Created by the connector (e.g. Stackroom), not by the action system.
- Drafts use UUID primary keys throughout.

---

## Known gotchas

- **Triage actions are steward-gated:** `perform_action` enforces steward+ explicitly. Base members can see the queue but cannot act on it.
- **Edit blocked on non-active drafts:** PATCH returns an error if the draft status is not `active`. Call `open` first on a `candidate`.
- **`reactivate` does not create an audit entry:** Unlike `archive` and `discard`, reactivating a draft leaves no `ReviewQueueEntry` record.
- **Feedback update/delete is superuser-only:** Group admins cannot modify feedback item status via API in the current release.
- **No direct link from promoted draft to WritingPiece:** After `promote`, the resulting canonical object exists but the API response does not return a link to it. The client must look up the WritingPiece separately. Resolved in Phase 2.

---

## Key source files

| Purpose | Path |
|---------|------|
| MillDraft views + actions | `fundamentals/api/views.py` |
| URL routing | `fundamentals/api/urls.py` |
| Serializers | `fundamentals/api/serializers.py` |
| MillDraft models | `fundamentals/models_milldraft.py` |
| Promotion service | `fundamentals/services/draft_promotion.py` |
| Feedback views | `feedback/api/views.py` |
| Feedback URLs | `feedback/api/urls.py` |
| Tests | `fundamentals/tests/test_workbench_api.py` |

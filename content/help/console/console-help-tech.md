---
title: Console — Technical Reference
subsystem: console
area: overview-tech
excerpt: Technical reference for the Console app — models, API endpoints, Celery tasks, admin controls, and integration points with Switchboard.
routes:
  - /console
  - /console/*
  - /worktable
  - /worktable/*
workAreas:
  - ConsoleWorkArea
  - WorkTableWorkArea
tags:
  - console
  - hub
  - worktable
  - switchboard
  - actionrun
---

# Console — Technical Reference

---

## For admins

**Admin access:** Console models are registered in Django admin at `/admin/console/`. You need `is_staff` at minimum; superuser for Switchboard-proxied operations.

**HubCapture admin:** List view shows kind, status, owner, and a body preview (first 80 chars). Filter by kind and status. No bulk editing — captures are personal records.

**AgentPersona admin:** Grouped fieldsets for identity (name, role, sponsor) and voice/tone (tone_summary, tone_tags, constraints, writing_sample). Only `is_active` personas are dispatched.

**Clearing stuck captures:** Captures stuck at `status=processing` (failed transcription, worker down) can be reset to `status=open` from the admin detail view. Set `transcript_error` to a description of why.

---

## API endpoints

All endpoints require `IsAuthenticated`. Superuser is required for Switchboard-proxied operations (noted below).

### Aggregation views (read-only)

| Method | Route | View | Description |
|--------|-------|------|-------------|
| GET | `/api/console/reentry/` | `ReentryView` | Recent reads + open drafts, 7 items max |
| GET | `/api/console/signals/` | `SignalsView` | Marker occurrences + flagged-for-reread |
| GET | `/api/console/orientation/` | `OrientationView` | Active initiatives + group memberships, 5 each |
| GET | `/api/console/stewardship/` | `StewardshipView` | Stale drafts (30d+), overdue reminders, open questions |

### HubCapture CRUD

| Method | Route | View | Notes |
|--------|-------|------|-------|
| GET | `/api/console/hub/captures/` | `HubCaptureListCreateView` | List user's captures |
| POST | `/api/console/hub/captures/` | `HubCaptureListCreateView` | Create capture |
| PATCH | `/api/console/hub/captures/{id}/` | `HubCaptureDetailView` | Update status, body, remind_at |
| POST | `/api/console/hub/captures/voice/` | `HubCaptureVoiceView` | Multipart audio upload; queues transcription task |
| POST | `/api/console/hub/captures/promote/` | `HubCapturePromoteView` | Batch-promote captures to List or Initiative |

### WorkTable

| Method | Route | View | Notes |
|--------|-------|------|-------|
| GET | `/api/worktable/stream/` | `WorkTableStreamView` | Cursor-paginated merge of HubCaptures + ApertureLogEntries |
| POST | `/api/worktable/prose/` | `WorkTableProseView` | Create ApertureLogEntry prose |
| POST | `/api/worktable/entries/{id}/archive/` | `WorkTableEntryArchiveView` | Archive an entry |
| DELETE | `/api/worktable/entries/{id}/` | `WorkTableEntryDeleteView` | Delete an entry |

### Switchboard-proxied operations (superuser only)

These live in `switchboard/api/views.py` but act on console data. All produce ActionRun records.

| Method | Route | Tool name | ActionRun |
|--------|-------|-----------|-----------|
| POST | `/api/switchboard/agent/note` | `agent.note` | Yes (Phase 0) |
| POST | `/api/switchboard/agent/remind` | `agent.remind` | Yes (Phase 0) |
| POST | `/api/switchboard/agent/task` | `agent.task` | Yes (Phase 0) |
| POST | `/api/switchboard/agent/parse` | — | No ActionRun |

### Switchboard Generate endpoints (authenticated users)

Phase 3 verbs are available to all authenticated users from the Console Generate sidebar. All produce ActionRun records. Cloud paths require the `initiatives.approve_cloud_dispatch` permission.

| Method | Route | Tool name | Local | Cloud | Notes |
|--------|-------|-----------|-------|-------|-------|
| POST | `/api/switchboard/draft` | `console.draft` | IsAuthenticated | `approve_cloud_dispatch` | Content type, tone, length, approval mode in payload |
| POST | `/api/switchboard/refine` | `console.refine` | IsAuthenticated | `approve_cloud_dispatch` | Input text + style instruction |
| POST | `/api/switchboard/add` | `console.add` | IsAuthenticated | — | Synchronous; no LLM |
| POST | `/api/switchboard/find` | `console.find` | IsAuthenticated | — | Semantic IR; synchronous |
| POST | `/api/switchboard/research` | `console.research` | IsAuthenticated | — | Always LOCAL; external sources |
| POST | `/api/switchboard/pattern` | `console.pattern` | IsAuthenticated | — | Pattern detection across inputs |
| POST | `/api/switchboard/synthesize` | `console.synthesize` | IsAuthenticated | — | Multi-input narrative merge |

`tool_name` surface prefix is `console` when triggered from Console; same verbs triggered from Puddlejump use `puddlejump` as the prefix. This lets signals distinguish origin surface in `on_action_run_saved`.

---

## Data model

### HubCapture

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `owner` | FK → User | Personal to this user |
| `kind` | CharField | `note`, `fix`, `need_more`, `remind` |
| `body` | TextField | Capture text; populated from voice transcription if audio |
| `visibility` | CharField | `private`, `shared` |
| `status` | CharField | `processing`, `open`, `failed`, `resolved`, `promoted` |
| `audio_file` | FK → AudioFile | Present for voice captures |
| `group` | FK → Group | Optional group association |
| `promoted_to` | GFK | Points to the List or Initiative this was promoted to |
| `remind_at` | DateTimeField | Null unless kind=remind |
| `resolved_at` | DateTimeField | Set when status→resolved |
| `archived_at` | DateTimeField | Set when archived |
| `transcript_error` | TextField | Non-empty when transcription failed |

**Status flow:** `processing` (voice only, pending transcription) → `open` → `resolved` or `promoted`.

### AgentPersona

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `sponsor` | GFK | The object this persona is attached to (initiative, group, etc.) |
| `name` | CharField | Display name |
| `role` | CharField | Functional role description |
| `tone_summary` | TextField | Short tone description for prompt injection |
| `tone_tags` | JSONField | Array of tone descriptors |
| `constraints` | TextField | Behavioral constraints for the persona |
| `writing_sample` | TextField | Example output used for style calibration |
| `is_active` | BooleanField | Only active personas are dispatched |

---

## Celery tasks

| Task | Module | Queue | ActionRun | Description |
|------|--------|-------|-----------|-------------|
| `transcribe_hub_capture_task` | `console.tasks` | `transcription` | Yes (Phase 0) | Transcribes voice capture via Concord/Whisper; parses list items for fix/need_more kinds |

**ActionRun for transcription:** `tool_name="console.transcribe"`, `execution_mode=LOCAL`, `initiator_id=str(capture.owner_id)`. On success: `result_payload={captures_created, transcript_length}`. On failure: `error_payload={error, capture_id}`.

**Retry behavior:** Max 3 retries with 10s base delay. On retry exhaustion, capture is set to `status=failed` and `transcript_error` is populated.

---

## Signals registry

Defined in `console/signals.py`. The marker registry maps single-character keys to signal slugs and display labels:

| Key | Slug | Symbol | Label |
|-----|------|--------|-------|
| `!` | `important` | `/!` | Important |
| `~` | `inprogress` | `/~` | In Progress |
| `?` | `question` | `/?` | Question |
| `@` | `delegated` | `/@` | Delegated |

---

## Switchboard integration — current state

Console routes all AI operations through Switchboard's typed-operation policy.

| Verb | Phase | Status | Route |
|------|-------|--------|-------|
| `agent.note`, `agent.remind`, `agent.task` | 0 | Live | Superuser only via proxy endpoints |
| `agent.parse` | 0 | Live | Synchronous; no ActionRun yet |
| `console.transcribe` | 0 | Live | LOCAL; Concord/Whisper; ActionRun produced |
| `classify`, `context_shape`, `summarize` | 1a | Live | Available via Switchboard queue |
| `console.draft` | 1c / Phase 3 | Live | LOCAL default; cloud with `approve_cloud_dispatch` |
| `console.refine` | Phase 3 | Live | LOCAL default; cloud with `approve_cloud_dispatch` |
| `console.add` | Phase 3 | Live | LOCAL; synchronous |
| `console.find` | Phase 3 | Live | LOCAL; synchronous IR |
| `console.research` | Phase 3 | Live | Always LOCAL |
| `console.pattern` | Phase 3 | Live | LOCAL |
| `console.synthesize` | Phase 3 | Live | LOCAL |

**Approval modes:** The frontend persists the user's choice (`standard`, `reviewed_default`, `trusted_default`) in `localStorage` under the key `draft_approval_mode`. The selected mode is passed to the backend in the request payload; the backend enforces it against the user's permission level. See ADR-0045 §6 for the full permission table.

---

## Known gotchas

- **Voice capture status stuck at `processing`:** Happens when the transcription worker is down or the audio file path is missing. Reset via admin: set `status=open`, clear `transcript_error`. The audio file won't be retranscribed.
- **`agent.parse` has no ActionRun:** The parse proxy is synchronous and predates the ActionRun pattern. It will be wrapped in Phase 1.
- **Group permission guard not applied:** Console endpoints use `IsAuthenticated` only. Group-scoped operations (future) will need `PermissionService.can_user_perform_action()`. Tracked in advisory doc.
- **`promoted_to` target set is limited:** Currently supports List and Initiative. LibraryItem is the planned next target (see `planning/switchboard/advisory-fan-out-consistency.md`).

---

## Key source files

| Path | Contents |
|------|---------|
| `app/console/models.py` | HubCapture, AgentPersona |
| `app/console/services.py` | Aggregation: get_reentry_items, get_signals, get_orientation, get_stewardship |
| `app/console/tasks.py` | transcribe_hub_capture_task |
| `app/console/signals.py` | SIGNAL_MARKER_REGISTRY |
| `app/console/api/views.py` | All console + worktable endpoints |
| `app/console/api/urls.py` | URL routing |
| `app/switchboard/api/views.py` | agent.note, agent.remind, agent.task proxies |
| `app/switchboard/api/serializers.py` | AgentNoteCommandSerializer, AgentReminderCommandSerializer, AgentTaskCommandSerializer |

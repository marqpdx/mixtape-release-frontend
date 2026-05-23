---
title: The Workbench
subsystem: workbench
area: overview
excerpt: The Workbench is where content goes from raw to ready — a triage and routing surface for managing incoming submissions and deciding what moves forward.
routes:
  - /workbench
  - /workbench/*
  - /groups/*/workbench
  - /groups/*/workbench/*
  - /member/*/workbench
workAreas:
  - WorkbenchCurationWorkArea
tags:
  - workbench
  - curation
  - triage
---

# The Workbench

The Workbench is where content goes from raw to ready.

Every piece of content that enters Mixtape — whether someone submitted feedback through Lighthouse, a document was uploaded to a library, or you drafted something from scratch — eventually lands here as a candidate waiting for a decision.

The Workbench is not a writing tool. It is a **triage and routing surface**. You look at what came in, decide what's worth pursuing, and either move it forward or set it aside.

---

## The curation suite

Mixtape has two surfaces that together handle the full journey from capture to publication:

**Workbench** — triage, queue, routing
Handles the question: *"Is this worth working on?"*
You see candidates, review what they contain, and take an action.

**Draft Room** — writing, editing, publishing
Handles the question: *"Is this ready to publish?"*
You write, revise, and publish finished pieces.

The connection between them: when you **promote** a candidate in the Workbench, it becomes a WritingPiece in the Draft Room. From there you edit it and publish it normally.

---

## Where to find it

- **Global Workbench** — `/workbench` — everything across all sources, all groups
- **Group Workbench** — `/groups/[group-name]/workbench` — scoped to one group

The global Workbench is the right starting point for daily triage. Group workbenches are useful when you're focused on a specific group's content.

In the current group workbench UI, the main tabs are:

- **Review Queue**
- **Compose**
- **My Drafts**

The dedicated queue route under `/groups/[group-name]/workbench/queue` is a narrower entry into the same review flow.

---

## The two queues

### Feedback tab

Shows items submitted through **Lighthouse** (the floating feedback button) and other capture beacons.

Each row shows:
- The message the user submitted
- Which beacon it came from (Lighthouse, inline beacon, etc.)
- The kind (issue, bug, request, idea)
- Current status
- Who submitted it and when

**Actions on each feedback item:**

| Action | What it does |
|---|---|
| Accept | Marks the item as sent to agent — moves it to the AI workflow |
| Archive | Marks it as won't fix — keeps the record but removes it from the active queue |
| Delete | Permanently removes the item |

Use the **kind** and **status** filters at the top to narrow the list. The default view shows items with status `new` — the freshest unreviewed submissions.

---

### Review Queue and draft work

Shows **MillDraft candidates** — structured content suggestions from connected sources.

Currently active sources:
- **Stackroom** — documents uploaded to a library are automatically processed and appear here as candidates
- **Manual** — drafts created directly in the Workbench compose panel

Coming soon: Concord (voice transcriptions), Grist Mill (manual grist authoring), Copy Desk (editorial suggestions).

Each row shows:
- Title (derived from the source content)
- Source (which system produced it)
- Content profile (writing, event, etc.)
- Current status in the lifecycle
- Author and date

**The MillDraft lifecycle:**

```
candidate → active → ready to promote → promoted → (archived)
```

| Status | Meaning |
|---|---|
| candidate | Arrived, not yet opened |
| active | Opened and being edited |
| ready to promote | Validated and staged |
| promoted | Promotion succeeded — a canonical object was created |
| archived | Set aside (recoverable) |

---

## Taking action on a MillDraft

When you select a MillDraft from the queue, you can take one of these actions:

**Open** — moves the draft from `candidate` to `active` and opens it for editing. Use this when the content looks promising and you want to work on it.

**Approve for consideration** — marks the draft as reviewed without changing its state. Creates an audit record. Use this when you want to flag something as worth pursuing but aren't ready to open it yet.

**Promote** — runs validation and creates a canonical object (WritingPiece, etc.) from the draft. The resulting piece appears in the Draft Room as a draft ready for editing. *(For now, you'll need to open Draft Room separately and find the piece there — a direct link is coming.)*

**Promote + Publish** — same as promote, but publishes immediately. Only available for content profiles that allow it (PSC-1). The system runs safety checks before allowing this.

**Archive** — sets the draft aside. It stays in the system as a record and can be reactivated later if you change your mind.

**Reactivate** — brings an archived draft back to active status. Use this if you archived something prematurely or want to revisit it. The draft re-enters the normal flow.

**Discard** — soft-deletes the draft. It's gone from the active queue but retained in the database for 90 days before permanent removal.

---

## Compose

The Compose tab (inside group workbenches) lets you create a MillDraft from scratch — a blank slate that starts as a candidate in the queue, ready for the same triage flow as anything that came in automatically.

In the current group workbench page, creating a draft sends you to **My Drafts** so you can keep working on it immediately.

---

## Draft Room — what happens after promotion

When you promote a MillDraft, Mixtape creates a **WritingPiece** (in draft status) and it appears in your **Draft Room**.

**Current limitation:** After promotion, there is no direct link from the Workbench to the resulting WritingPiece. You need to open Draft Room separately and find it there. This is the primary navigation gap in the current release. A direct link is the first thing coming in Phase 2.

From the Draft Room you can:
- Edit the content in the full writing editor
- Use the Copy Desk panel for AI-assisted editorial work
- Use the Inspector to check readiness (title, excerpt, word count)
- Publish when it's ready

The Workbench does not delete the promoted MillDraft — it transitions to `promoted` status and stays in the system as a provenance record, showing where the content came from.

## Personal workbench note

If you arrive via `/member/[username]/workbench`, the current app redirects you to `/console`. Treat that route as legacy entry rather than a separate personal workbench experience.

---

## Filters and navigation

Both queues support filtering:

- **Feedback queue**: filter by kind (issue / bug / request / idea / all) and status
- **MillDrafts queue**: filter by status, content profile, and source type

The Refresh button at the top right of each tab reloads the queue without a full page refresh.

---

## Who can use the Workbench

Access is role-gated:

| Role | What they see |
|---|---|
| Superuser / Admin | Global Workbench — all sources, all groups |
| Group Admin / Steward | Group Workbench — that group's queue only |
| Member | Personal view (own drafts and submissions) — coming in a future release |

---

## What the Workbench is not

- It is not a writing tool — for writing, use the Draft Room
- It is not a publishing tool — publishing happens in the Draft Room via the Inspector
- It is not a search interface — for retrieval from libraries, use the Stackroom

---

## Roadmap

The Workbench will absorb more of the curation surface over time:

- **Phase 2** (next): Draft Room becomes a panel within the Workbench — edit without leaving triage
- **Phase 3**: Stackroom retrieval panel embedded in the Workbench — surface supporting material while editing
- **Phase 4**: Full promotion system — approve, promote, publish as governed actions with audit trail

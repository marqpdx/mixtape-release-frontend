---
title: Initiatives
subsystem: initiatives
area: overview
excerpt: Initiatives are your group's long-running thinking threads — a place to capture, distill, and build on ideas across multiple sessions over time.
routes:
  - /groups/*/initiatives
  - /groups/*?section=initiatives-landing
workAreas:
  - InitiativesWorkArea
tags:
  - initiatives
  - sessions
  - ai
  - thinking
---

# Initiatives

Initiatives are how groups pursue ideas over time. Where a single conversation disappears, an Initiative accumulates — sessions build on each other, the AI distills what emerged, and a rolling picture of the work takes shape.

An Initiative has a title and an optional direction (a compass heading, not a rigid scope). Inside it, you hold sessions: conversations — voice or text — where you think through the work. At the end of each session, the AI proposes what to keep. You curate it, and the Initiative updates.

---

## Key concepts

**Initiative** — A named, group-scoped thread for ongoing thinking or work. It persists across sessions and accumulates what the group has figured out.

**Direction** — A short statement of where the Initiative is pointed. Not a deliverable — more of a compass heading. Optional, but helpful for keeping sessions focused.

**Session** — A single conversation within an Initiative. You speak or type; the AI participates and responds. When you end the session, it's distilled into the rolling record.

**Distillation** — At the end of a session, the AI proposes what was decided, what questions are still open, and what the work looks like now. You review each item and accept, edit, or discard it.

**Rolling summary** — The living document of the Initiative. It accumulates across sessions: current direction, key decisions, open questions, where things stand now. You can edit it directly at any time.

**Artifact** — Something the Initiative produced — a distillation item, a document routed out to the rest of Mixtape, a note. Artifacts appear on the Initiative's timeline.

**Status** — Where the Initiative stands: `active` (in motion), `simmering` (ongoing but not the current focus), `paused` (on hold), `resolved` (finished), or `archived` (closed out).

---

## How to start working in an Initiative

### Create an Initiative

1. Go to your group's Initiatives section.
2. Click **New Initiative**.
3. Give it a title. Add a direction if you have one — a sentence about where this is headed.
4. The Initiative is created in `active` status and ready for its first session.

### Start a session

1. Open the Initiative.
2. Click **Start Session**.
3. Talk or type. The session captures your input and the AI's responses.
4. When you're done, click **End Session**.

### Review and curate the distillation

After ending a session, the AI proposes what to keep:

- **Decisions made** during this session
- **Open questions** that surfaced
- **A summary** of where things stand

Review each item. Accept what belongs, edit what's close, skip what doesn't fit. What you accept is merged into the rolling summary.

---

## What the rolling summary looks like

The rolling summary has four parts:

- **Current direction** — where the Initiative is pointed right now
- **Key decisions** — what has been decided (accumulates across sessions)
- **Open questions** — what's still unresolved
- **Where we are now** — a plain-language account of the current state

You can edit any of these directly — the AI proposes, but you own the record.

---

## Routing artifacts out of an Initiative

When a session produces something worth saving elsewhere, you can route it:

- **To Puddlejump** — send it as a candidate document for review and promotion
- More destinations are planned

Routed artifacts appear on the Initiative timeline with a provenance record showing where they came from.

---

## Initiative statuses

| Status | What it means |
|--------|---------------|
| Active | In motion — current focus of work |
| Simmering | Ongoing but not the current priority |
| Paused | On hold, with intent to resume |
| Resolved | Finished — the work is done |
| Archived | Closed out |

---

## Current limitations

- **Voice session transcription** is handled by Web Speech API in v0 — quality may vary by browser and device. Server-side transcription is planned for v1.
- **Single participant per session** — one person can hold a session at a time in v0. Multi-participant sessions are planned for v1.
- **Tableau routing** — the full routing surface (sending artifacts to more destinations) is planned. Puddlejump routing is the first destination available.

---

## Related features

- **Groups** — Initiatives are scoped to groups. Group membership is required for access.
- **Puddlejump** — Distillation artifacts can be routed to Puddlejump as candidate documents.
- **Stackroom** — Future integration planned: Initiatives will be able to pull from and push to the group's knowledge library.

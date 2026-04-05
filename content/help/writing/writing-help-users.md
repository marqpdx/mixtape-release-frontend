---
title: Writing
subsystem: writing
area: overview
excerpt: Mixtape's writing tools let you capture seeds, shape drafts, and publish deliberately without losing the thread of your work.
routes:
  - /app/dashboard
  - /app/dashboard/*
  - /groups/*
workAreas:
  - DraftRoomWorkArea
tags:
  - writing
  - drafts
  - seeds
  - publishing
---

# Writing

Mixtape's writing system is designed to let you move from a quick capture to a finished piece without changing tools every time the work deepens. Start with a seed, move into a draft, refine metadata when it matters, and publish only when you are ready.

---

## What you can do here

- Capture quick ideas as seeds, including voice notes
- Open and edit longer drafts in the Draft Room
- Add titles, excerpts, tags, and categories when the piece is ready for shaping
- Publish with explicit control over audience and placement
- Keep unpublished work private while you are still thinking

---

## Key concepts

**Seed** — The fastest way to capture something worth returning to. A seed can start as a short note or a voice capture. Seeds are private by default.

**Draft** — A writing piece in progress. Drafts autosave while you work and stay unpublished until you make a separate publishing decision.

**Working document** — The live editing surface for a draft. This is where your latest unsent changes live while you are still shaping the piece.

**Publishing** — The act of turning a draft into a released piece. Publishing is explicit. Mixtape does not assume where a piece should appear.

**Placement** — Where a published piece appears. A placement can target your own reader-facing surfaces or a group-sponsored destination.

**Library / catalog** — The reader-facing surface where published pieces are gathered and browsed.

**Stream authoring** — The command-based writing flow that lets you emit related artifacts inline while staying in the same writing session.

---

## How to capture an idea quickly

1. Open the writing area where seeds are available.
2. Type into the quick-capture field or use voice capture if enabled.
3. Save the seed.
4. Return later and promote it into a fuller draft when the idea is ready to expand.

---

## How to write and save a draft

1. Open **Draft Room** from the dashboard writing section.
2. Create a draft or select one from the left rail.
3. Write first. Autosave will keep the current body safe while you work.
4. Use the right-side inspector to add title, audience, tags, and categories when the piece starts to take shape.
5. Save metadata updates before publishing.

---

## How to publish a piece

1. Open the draft you want to publish.
2. Click **Publish**.
3. Choose who the piece is addressed to and who should be able to read it.
4. Review the destinations and placement options that are offered.
5. Confirm the publish action.

Publishing is deliberate. A draft is not distributed automatically just because it exists.

---

## How to use stream commands during writing

When you are writing and need to break out a related artifact without leaving the surface:

1. Type `/new [type] [title]` on a new line.
2. The editor inserts a boundary marker and starts routing the writing below that marker into the new artifact.
3. Type `/renew` to return to the original piece.
4. If you remove a boundary marker, the segmented content merges back into the anchor piece.

This is most useful when a thought belongs somewhere else but you do not want to lose momentum in the current draft.

Supported types currently include `writingpiece`, `seed`, `event`, and `course`.

---

## Current limitations

- Some writing surfaces are still evolving, especially around series shaping, import, and lifecycle management.
- Group-sponsored writing permissions are still being tightened; some controls may follow broader group admin permissions until dedicated writing permissions are fully in place.
- Voice capture and transcription can take time depending on device and server conditions.
- Import and distribution tooling are improving quickly, so publishing-related UI may change as article workflows solidify.

---

## Related features

- **Workbench / curation** — Structural shaping for groups that assemble and merge source material before promoting it into fuller drafts.
- **Groups** — Group-sponsored writing lets a piece live in a shared editorial context instead of only a personal one.
- **Help Hub** — Use the Help drawer or `/app/help` when you need contextual guidance while writing.
- **Catalog / display surfaces** — Published pieces can later feed public reading surfaces and external distribution.

---

## Roadmap

- **Import improvements** — Batch `.md` and `.docx` import is being built out so externally drafted writing can enter Mixtape cleanly as editable drafts.
- **Series shaping** — Multi-piece structural editing and working-set flows are expanding.
- **Synopsis + distribution** — Publishing will eventually feed synopsis-based display and LinkedIn distribution adapters.

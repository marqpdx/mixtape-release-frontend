---
title: Puddlejump
subsystem: puddlejump
area: overview
excerpt: Puddlejump is Mixtape's canonical document library system. Curate, approve, version, and export your group's authoritative documents through a structured review process.
routes:
  - /puddlejump
  - /puddlejump/*
workAreas:
  - PuddlejumpWorkArea
tags:
  - puddlejump
  - documents
  - canon
---

# Puddlejump

Puddlejump is Mixtape's canonical document library system. It gives groups a structured way to curate, approve, version, and export their agreed knowledge — the documents that are authoritative for the group. Documents move through a review process before being marked Canon, after which every change is tracked.

Puddlejump is a governance and curation tool — not a CMS, not a legal archive, and not a replacement for the writing and drafting tools in Inkwell.

---

## Key concepts

**Canon Library** — A group's curated collection of approved documents. Each group has one Canon Library. Documents in it are considered authoritative.

**Canon status** — A document is Canon when a Group Admin (or a user with the Canon approval permission) approves it. Before approval, documents are editable but not yet canonical.

**Version history** — Once a document is Canon, every subsequent edit creates a new version record tracking who changed it, when, and what changed. History is stored in Mixtape and not included in exports.

**Check-out / Check-in** — Checking out a document signals that you're actively editing it. Other users are notified but not blocked — there are no hard locks in the current version.

**Bundle** — A portable export of the Canon Library: a zip archive containing all Canon documents plus a machine-readable manifest (`puddlejump.json`) and a human-readable catalog (`PUDDLEJUMP.md`).

**Personal library** — Every user has a personal Puddlejump library in addition to any group libraries. A personal library is sponsored by the user themselves.

---

## What you can do

### View your group's Canon Library

- Navigate to your group's Puddlejump section.
- All Canon and in-progress documents are listed.

### Check out a document to edit it

- Open a document and select Check Out.
- Other editors are notified you're working on it.
- Check In when done to signal the edit is ready for review.

### View version history

- Open any Canon document.
- The version history shows all changes since it was first canonized: who changed it, when, and a summary.

---

## Current limitations

- **No hard locking:** Checkout is advisory only. Two users can edit the same document simultaneously; all changes are recorded, but the system does not prevent conflicts.
- **Markdown only:** Puddlejump only handles Markdown documents in the current version. PDF, Word, and other formats are not supported.
- **Export is a direct download:** The export produces a zip file downloaded directly — not a shared link or cloud storage URL.

---

## Related features

- **Groups** — Group Canon Libraries are owned by groups. Admin or owner membership is required for approval actions.
- **Stackroom** — Canon Library exports feed directly into Stackroom ingestion for AI knowledge extraction.
- **Inkwell / Mill** — Puddlejump governs and certifies documents. Inkwell and Mill are where documents are authored.

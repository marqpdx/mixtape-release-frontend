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

### View your library

The left sidebar has three sections: **Library**, **Utilities**, and **Generate**.

Under Library:
- **Overview** — Your library's health summary: total files, Canon coverage percentage, files with or without summaries, and a one-click export button.
- **Files** — The full file list. Browse, search, and open individual documents.

### Check out a document to edit it

- Open a document in the Files view and select Check Out.
- Other editors are notified you're working on it.
- Check In when done to signal the edit is ready for review.

### View version history

- Open any Canon document in the Files view.
- The version history shows all changes since it was first canonized: who changed it, when, and a summary.

---

## Utilities

The Utilities section contains analysis and maintenance tools for your library. None of these tools modify your files directly — they surface findings for you to act on.

**Duplicates** — Finds documents in your library that are substantially similar to each other. Helps you consolidate redundant content before it causes confusion.

**Glossary** — Extracts and surfaces terminology defined across your library's documents. Useful for identifying inconsistent naming or undocumented jargon.

**Canonical** — Surfaces documents that are close to meeting Canon criteria. Helps you work through the backlog of files that are well-formed but not yet approved.

**Summaries** — Runs AI-assisted summary suggestions across your library files. For each document that doesn't have a summary, the tool proposes one. You can accept or dismiss each suggestion individually.

**Restructure** — Analyzes your library's folder and naming structure and suggests reorganization options. Helps you keep the library navigable as it grows.

---

## Generate

The Generate section gives you access to Switchboard's AI tools scoped to your library. These tools run in the context of Puddlejump — results are aware of your library's content and structure.

| Tool | What it does |
|------|-------------|
| **Draft** | Generate a first draft from a prompt. Choose content type (email, message, SOP, document, proposal, summary), tone, and length. Runs locally by default; cloud requires approval. |
| **Refine** | Polish or restructure existing text. Paste content in, describe the change you want, and choose a style. |
| **Add to list** | Add a batch of items to an existing library list using natural language input. |
| **Find in library** | Semantic search across your library. Enter a question or phrase; returns ranked matches with relevance scores. |
| **Research** | Look up information from external sources and get a structured response. Always runs locally — no cloud dispatch. |
| **Pattern** | Identify recurring themes, structures, or gaps across a set of text inputs. |
| **Synthesize** | Combine multiple inputs into a single coherent output with a narrative structure. |

Draft and Refine can optionally run in cloud mode for higher-quality output. When cloud dispatch is enabled, you'll see an approval step before the request is sent.

---

## Current limitations

- **No hard locking:** Checkout is advisory only. Two users can edit the same document simultaneously; all changes are recorded, but the system does not prevent conflicts.
- **Markdown only:** Puddlejump only handles Markdown documents in the current version. PDF, Word, and other formats are not supported.
- **Export is a direct download:** The export produces a zip file downloaded directly — not a shared link or cloud storage URL.
- **Utilities are read-only:** Duplicates, Glossary, Canonical, Summaries, and Restructure surface findings only. Accepting or applying changes still requires manual action.

---

## Related features

- **Groups** — Group Canon Libraries are owned by groups. Admin or owner membership is required for approval actions.
- **Stackroom** — Canon Library exports feed directly into Stackroom ingestion for AI knowledge extraction.
- **Console** — The Generate tools in Puddlejump are the same verbs available in Console's Generate sidebar, scoped to your library context.
- **Inkwell / Mill** — Puddlejump governs and certifies documents. Inkwell and Mill are where documents are authored.

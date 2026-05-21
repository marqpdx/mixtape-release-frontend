---
title: Writing — Suggested Revisions
subsystem: writing
area: suggested-revisions
excerpt: Use draft analysis to create a non-destructive suggested revision of a long or disorganized draft, then compare it to the original before deciding what to keep.
routes:
  - /app/dashboard
  - /app/dashboard/*
  - /groups/*
workAreas:
  - WriteComposer
  - OutlineDrawer
tags:
  - writing
  - outline
  - revision
  - fidelity
  - draft-analysis
---

# Writing — Suggested Revisions

Suggested revisions are a safe way to get structural help on a messy draft without putting the original at risk. Instead of rewriting the piece in place, Mixtape analyzes the current draft, creates a separate sibling draft, and shows you a short fidelity summary of what changed.

The original draft stays exactly where it was.

---

## What you can do here

- Analyze a large or disjointed draft from the outline panel
- Create a separate draft named as a suggested revision
- Open the suggested draft and work on it without touching the original
- Review a fidelity summary that explains how much changed

---

## Key concepts

**Suggested revision** — A new draft created from the current draft after structural analysis. It is a sibling, not a replacement.

**Original draft** — The draft you started with. Mixtape does not overwrite it during this workflow.

**Fidelity report** — A compact explanation of what changed between the original draft and the suggested revision. It focuses on structure first: what stayed the same, what was edited, and what was added or removed.

**Outline analysis** — A structural pass over the current draft. It looks at headings, blocks, and outline shape rather than silently rewriting your whole piece.

---

## How to create a suggested revision

1. Open the draft you want to work on in the writing composer.
2. Open the **Outline** panel.
3. In the **Analyze Draft** section, click **Analyze for suggested revision**.
4. Wait for Mixtape to finish analyzing the current draft.
5. Click **Create Suggested Revision**.
6. Mixtape creates a new draft named like `Original Title - Suggested Revision`.
7. Review the fidelity summary shown in the panel.
8. Click **Open Suggested Draft** to move into the new draft and continue working there.

---

## What happens when you do this

When you create a suggested revision:

- the original draft stays unchanged
- a new draft is created
- the new draft gets its own working document
- Mixtape records the relationship between the source draft and the suggested revision
- a fidelity report is attached so you can see what changed

This is meant to support editorial exploration, not force a rewrite.

---

## How to use the fidelity summary

The first version of the fidelity summary is intentionally simple. It tells you things like:

- how many blocks were left unchanged
- how many blocks were edited
- whether new blocks were added
- whether any blocks were removed

Use it as a confidence check before you commit to working from the suggested revision.

If the summary says most blocks were unchanged, that usually means Mixtape found a structural reorganization path without heavily rewriting the piece.

---

## How to work safely with both drafts

The best pattern is:

1. Keep the original draft as your source of truth.
2. Open the suggested revision in a second pass.
3. Compare the new structure to the original draft.
4. Continue editing only the version you want to keep moving forward.

You do not need to decide immediately. The point of the flow is to let you compare options instead of betting everything on one pass.

---

## Current limitations

- **This is structure-first, not a magic rewrite button:** the system is designed to help reorganize drafts safely, not replace editorial judgment.
- **The fidelity summary is still compact:** the current version reports high-level change counts rather than a full block-by-block visual diff.
- **The first UI is in the Outline panel:** the workflow is intentionally narrow for now and has not yet been expanded into a richer side-by-side review tool.
- **Suggested revisions are created explicitly:** Mixtape does not auto-generate or auto-open a new revision without you asking for it.
- **Collaborative edge cases are still ahead:** the current flow is built for the core draft workflow first, not full collaboration-aware reorganization.

---

## Related features

- **Writing overview** — Covers the broader writing lifecycle from seeds to drafts to publishing.
- **Outline** — The place where suggested revision analysis currently begins.
- **Publishing and Distribution** — Suggested revisions remain drafts until you intentionally publish one.
- **Copy Desk Intelligence** — Other writing assistance tools that shape work without silently changing your draft.

---

## Roadmap

- **Richer fidelity review:** more useful explanation of structural changes and clearer visual comparisons.
- **Better analysis proposals:** stronger section suggestions for large imported or long-running drafts.
- **Approval-focused revision flow:** a more explicit review step before creating the suggested revision draft.
- **Deeper inline fidelity:** later versions may report formatting and smaller text-level changes, not just block-level structure.

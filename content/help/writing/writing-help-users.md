---
title: Writing
subsystem: writing
area: overview
excerpt: Mixtape's writing system stays out of your way — capture seeds, draft longer pieces, and publish with explicit control over who can read your work.
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
---

# Writing

Mixtape's writing system is built around one idea: start writing, worry about structure later. Whether you're capturing a quick idea on your phone or drafting a long essay, the system is designed to stay out of your way until you're ready to share.

---

## What you can do here

- Capture quick ideas as Seeds (text or voice)
- Draft longer pieces in the Draft Room
- Publish with explicit control over who can read your work and where it appears
- Organize published work onto shelves in your Library
- Promote a captured idea into a full draft with one action

---

## Key concepts

**Seed** — The lowest-friction capture unit. A short note, a voice recording, or a clipped thought. Seeds are private by default and never published automatically. They are the raw material that lives upstream of everything else.

**Draft** — A writing piece in progress. Drafts autosave continuously. You can have many drafts open at once and switch between them freely.

**Working copy** — The live editing version of a draft. Autosave writes here. When you publish, the working copy is merged into the canonical piece.

**Publishing** — The act of finalizing a draft as a canonical, timestamped artifact. Publishing does not automatically make your work visible to anyone — you choose where it goes.

**Shelf** — A curated collection in your public Library where readers find your published work. You decide which pieces go on which shelves, and shelves can be public, members-only, or unlisted.

**Library** — Your outward-facing writing home. Readers who want to browse your writing come here.

**Work Session** — When you use the stream commands (`/new`, `/renew`) in the editor, the system quietly creates a Work Session that links all the artifacts you produce in one writing flow. You don't need to manage this — it happens automatically.

---

## How to capture an idea quickly

1. Go to your Seeds page.
2. Type your idea into the text box and press Save, or tap the microphone to record a voice note.
3. Your seed is saved immediately and privately. Nothing is published.
4. When you want to develop the idea, open the seed and choose **Promote to Draft**. This creates a new draft pre-filled with your seed's text.

---

## How to write and save a draft

1. Open the Draft Room (your personal writing workspace).
2. Click **New Draft** or open an existing draft from the list on the left.
3. Write. The system autosaves every few seconds — you will never lose work.
4. Use the inspector panel (right side) to add a title, excerpt, tags, and categories when you're ready — none of these are required to start writing.

---

## How to publish a piece

1. Open the draft you want to publish.
2. Click **Publish**.
3. Choose your audience:
   - **Just me** — finalizes the piece privately; nothing appears in your Library.
   - **Readers** — makes the piece available to others.
4. If you choose Readers, select where it should appear: your personal Library, a group feed, a specific shelf, or a newsletter.
5. Confirm. The piece is published and placed only where you indicated.

Nothing is distributed automatically. Every placement is a deliberate choice.

---

## How to use stream commands during writing

When you're writing a long piece and want to quickly capture a related idea without stopping:

1. On a new line, type `/new Event` (or `/new Course`, `/new Seed`, etc.) and press Enter.
2. The editor switches to that artifact — write the content.
3. Type `/renew` on a new line to return to your original piece.

Your original piece continues from where you left off. The emitted artifact is saved as a draft of that type. The whole flow is recorded as a Work Session.

---

## Current limitations

- **Draft Room UI**: The full two-column Draft Room (list + editor + inspector) is specified but the dedicated Draft Room route may not yet be available in the app. Check your navigation for its current location.
- **Tableau / Curate surface**: Structural work like merging drafts, building series, and reordering pieces into a visual workspace (called Tableau) is designed but not yet built.
- **Content Hub / lifecycle dashboard**: The lifecycle-oriented dashboard for tracking Seeds → Drafts → Published → Library is designed but not yet built.
- **Series assignments**: The Draft Room inspector is specified to support assigning a piece to multiple series. This is not confirmed as built.
- **Voice transcription timing**: Voice seeds are transcribed in the background. Depending on server load, transcription may take up to a minute. The seed will show "Transcribing…" until it is ready.

---

## Related features

- **Storyline (Leaves)** — The social publishing surface. Leaves are a lighter-weight post type that live in your feed, distinct from full WritingPieces.
- **Stackroom** — Research and knowledge management. Published writing can be linked to Stackroom artifacts.
- **Library** — The public-facing shelf system where readers browse your published work.
- **Groups** — Writing can be published into group feeds, making it visible to group members.

---

## Roadmap

- **Tableau (Curate surface)**: Structural editing — merge, reorder, group, and build series from your drafts. Planned; not yet built.
- **Writing permissions**: Proper `edit_writing` and `publish_writing` group permissions are planned to replace the current proxy. This will affect who can edit or publish group-sponsored writing.
- **LinkedIn distribution**: A Synopsis + LinkedIn org-posting feature is spec'd. Not yet built.

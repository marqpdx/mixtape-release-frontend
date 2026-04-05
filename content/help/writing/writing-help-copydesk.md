---
title: Writing — Copy Desk Intelligence
subsystem: writing
area: copydesk
excerpt: The Copy Desk has smart tools that watch how your writing is going — word count targets, split suggestions, and split markers. All optional, none intrusive.
routes:
  - /writing
  - /writing/*
  - /drafts
  - /drafts/*
workAreas:
  - WritingEditorWrapper
tags:
  - writing
  - copydesk
  - split
  - word-count
---

# Writing — Copy Desk Intelligence

The Copy Desk has a few intelligent tools that watch how your writing is going and offer suggestions when they might be useful. None of them interrupt you. All of them are optional.

---

## Word Count Target

You can set a soft target for how long a piece should be.

In the **Statistics** panel (expand the Copy Desk sidebar), you'll find a **Word Count Goal** field. Type in a number — say, 800 for an op-ed or 400 for a newsletter post — and the editor will quietly track your progress.

- **Under target:** nothing changes. The word count display works as it always has.
- **Over target:** a small triangle icon appears next to your word count. That's the only signal — no alert, no popup, just awareness.

The target is yours. Set it, change it, or leave it blank. It has no effect on publishing.

---

## Split Suggestion

If you set a word count target and turn on **Suggest splitting**, the system will watch your progress. When your piece grows significantly beyond the target (about 15% over), it will quietly ask if the piece might work better as two separate pieces.

The suggestion appears as a small callout in the bottom-right corner of the screen:

> *"This piece may work well as 2 separate parts. Want to see where?"*

You have three options:

- **Tell me more** — the AI shows you exactly where it thinks the split could happen and why. You can read the reasoning and decide.
- **Not now** — closes the callout. The suggestion may appear again if you keep writing.
- **Keep as one piece** — permanently declines splitting for this piece. The suggestion won't come back unless you re-enable it in settings.

The AI never changes your writing. It only offers a suggestion. You decide what to do with it.

### Inserting split markers from an AI suggestion

If you choose "Tell me more" and the AI identifies split points, you'll see the suggested locations with brief explanations. At the bottom of that view is an **Insert split markers** button.

Clicking it places orange split markers directly into your document at the AI's suggested positions. You can then:
- Leave them as-is (they save with your draft)
- Move them by deleting one and inserting another where you prefer
- Remove any marker by clicking it and pressing Backspace or Delete

Split markers are part of your working draft only — they never appear in the published piece.

---

## Split Markers

A split marker is an orange divider in the editor that marks where you intend to divide a piece into two. It looks like this:

```
✂ Split here ────────────────────────────
```

Or, if it came from an AI suggestion:

```
✂ AI split point ─── (rationale text in italic)
```

### Inserting a split marker manually

Three ways:

**1. Toolbar button**
Click the scissors icon (✂) in the editor toolbar. A split marker is inserted at the cursor position.

**2. Slash command popup**
At the start of a new line, type `/`. A small menu appears. Select `/split`. The marker is inserted.

**3. Fenced command (power user)**
On its own line, type `/split` or `/split My Second Chapter`, then press Enter. The line is replaced with a split marker. The optional text after `/split` becomes the title label on the marker.

### What split markers do

Split markers are **visual anchors** in your draft. They:
- Save with your working copy
- Remind you (or a collaborator) where a split is intended
- Can be moved or removed at any time
- Signal to the "Execute split" flow exactly where to divide the piece

### Executing the split

Once you have one or more split markers in place, a small **Ready to split** banner appears in the bottom-right corner of the screen:

> *"N split marker(s) in this piece. Execute the split to open each part as a separate piece in a writing session."*

Clicking **Execute split** does the following without any further AI involvement:

1. The content before the first marker stays as the current piece.
2. The content after each marker becomes a new draft piece (one per marker).
3. All pieces open together in a **writing session** — the same multi-piece stream authoring environment used by the `/new` command.
4. You can continue editing all parts in one view, or close the session and work on them separately.

The split is **reversible** until you publish: pieces are all drafts, the session can be abandoned, and you can keep editing as normal.

**Titles for new pieces:** If your split marker had a label (e.g. `/split My Second Chapter`), that label becomes the working title for the new piece. Unlabeled markers create an untitled draft that you can name at any time.

### Removing a split marker

Click the marker to select it (it gets an orange outline), then press **Backspace** or **Delete**. The marker is removed.

---

## What These Features Are Not

- **Not a word limit.** The target is soft. You can write as long as you want.
- **Not AI editing.** The system never rewrites, summarises, or modifies your words.
- **Not required.** Every feature here is opt-in. You can use the editor exactly as before and never see any of this.
- **Not published.** Split markers, AI suggestions, and word count goals are all part of your working draft. Nothing from the Copy Desk Intelligence layer appears in your published piece.

---

## Settings Reference

| Setting | Where | What it does |
|---------|-------|-------------|
| Word Count Goal | Statistics panel → Word Count Goal | Sets the soft target. Leave blank for no target. |
| Suggest splitting | Statistics panel → Suggest splitting docs | Enables AI split suggestion when target is exceeded. Disabled until a target is set. |

---

*The Copy Desk Intelligence tools are designed to get out of your way. If something feels intrusive or unhelpful, use the "Keep as one piece" option or uncheck the settings. Your writing process is yours.*

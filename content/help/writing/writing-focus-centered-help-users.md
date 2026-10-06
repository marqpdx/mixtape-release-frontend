---
title: Write (Focus-Centered Writing)
subsystem: writing
area: focus-centered
excerpt: A faster, quieter path into writing — start typing immediately, resume exactly where you left off, and pick up classic writing tools only when you need them.
routes:
  - /write
  - /write/doc/*
  - /focus/*
workAreas: []
tags:
  - writing
  - drafts
  - capture
  - focus-centered
---

# Write

**Write** is a second, quieter path into Mixtape's writing tools, built for two moments: starting something new right away, and picking up exactly where you left off. It lives alongside Draft Room, Editor's Desk, and the other classic writing surfaces — those stay exactly as they are, and you can always switch back.

---

## What you can do here

- Start a new doc in one action, with no prompts for title, tags, or where it belongs
- Resume your most recently edited doc instantly, cursor and scroll position restored
- Browse everything you've recently touched, across every group and personal space
- Find a doc by title without leaving the keyboard

---

## Key concepts

**The Gate** — The `/write` landing page. Offers **New** and **Resume** first; everything else is secondary.

**The Page** — The actual writing surface, reached at `/write/doc/:id`. Same editor and autosave as Draft Room — nothing about how your writing is saved changes here.

**Pick up tools** — A collapsed tray on the Page for reaching classic tools (like Draft Room) for a doc when you need something Write doesn't offer yet.

**Focus** — A dedicated view for one piece of work until it's finished — today, that's publishing an Issue. Reached at `/focus/:id`, it shows the Issue's sequence of pieces, lets you reorder them, mark one as primary, and pull in unassigned drafts from the same space.

---

## Working on a Focus

A Focus gathers everything needed to finish one task — right now, publishing an Issue — in one place.

1. Open a Focus (from wherever it was started — Focus entry points are still being built out).
2. The **sequence** lists the Issue's pieces in order. Use the up/down arrows to reorder, and the star to mark one piece as primary.
3. **Unassigned docs** below the sequence lists other drafts from the same space — select **Add to issue** to pull one in.
4. Selecting a piece in the sequence highlights it and remembers your place, so returning to this Focus picks up where you left off.

---

## How to start writing immediately

1. Go to **Write** (or press `N` while on the Gate).
2. Start typing. There's no title prompt, no tag prompt — just the page.
3. Your work saves automatically, the same way it does in Draft Room.

---

## How to resume where you left off

1. Go to **Write**.
2. Press **Resume** (or hit `Enter`) to reopen your most recent doc, or pick any doc from the recent list.
3. The cursor and scroll position are restored to where you last were — even if you're on a different device than the one you last edited from.

---

## How to find a specific doc

1. On the Gate, press `/`.
2. Type part of the title.
3. Select it from the filtered list.

---

## Current limitations

- This is an early, in-progress surface — currently visible to superusers only while it's being built out.
- New docs default to your own personal space; there's no way yet to choose a group from the Gate itself.
- The "Pick up tools" tray currently only links out to Draft Room — Editor's Desk and Series Writing aren't linked yet.
- The Focus view doesn't yet have its own entry points (starting one, or "Continue this focus" / "Add to issue…") — those are a later phase of this surface.
- Selecting a piece in a Focus doesn't yet open editing tools in place (Edit, Shape, Sections, Preview) — that's also a later phase.

---

## Related features

- **Draft Room** — The classic, full-featured writing workspace. Write's Page reuses the same editor and autosave; nothing written in one is invisible to the other.
- **Help Hub** — Use the Help drawer or `/app/help` for broader writing guidance.

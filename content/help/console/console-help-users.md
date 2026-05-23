---
title: Console
subsystem: console
area: overview
excerpt: Console is your personal re-entry surface — a quick-capture hub and daily dashboard that keeps your most important work visible without getting in the way.
routes:
  - /console
  - /console/*
workAreas: []
tags:
  - console
  - capture
  - hub
  - worktable
  - signals
---

# Console

Console is your personal re-entry surface on Mixtape. It gives you a fast way to capture thoughts and tasks, and a daily view of what needs your attention — without requiring you to dig through groups, drafts, or notifications.

Think of it as your home base: you arrive here, you know what's open, and you leave with clarity on what's next.

---

## Key concepts

**HubCapture** — A quick capture: a note, a task, a reminder, or something you need to revisit. Captures live in your personal queue until you act on them, resolve them, or promote them to a permanent home.

**Signal** — A marker you apply to any piece of content to flag it for review. Signals use short notation:

| Signal | Meaning |
|--------|---------|
| `/!` | Important — this needs attention |
| `/~` | In progress — you're actively working on it |
| `/?` | Question — open and unresolved |
| `/@` | Delegated — handed off, but you're watching |

**WorkTable** — The running stream of everything you've captured, created, or flagged. It's a scrollable, filterable view of your full activity — captures, notes, prose — in reverse chronological order.

**Capture kinds:**

| Kind | Use it for |
|------|-----------|
| `note` | Anything you want to remember or act on later |
| `fix` | Something that's broken and needs fixing |
| `need more` | Something unfinished — a placeholder until you have more |
| `remind` | A time-based nudge to yourself |

---

## What you can do

### Capture something quickly

1. Open Console from the navigation.
2. Type in the capture field and choose a kind (note, fix, need more, remind).
3. For reminders, set a time.
4. Submit — your capture lands in your personal queue.

You can also capture by voice: tap the microphone icon, speak, and Console will transcribe and parse what you said into one or more captures automatically.

### Use signals

Signals let you flag content for follow-up from anywhere in Mixtape — a draft, an initiative, a conversation thread.

To apply a signal:
- Use the signal menu on any piece of content, or
- Type the signal notation (`/!`, `/~`, `/?`, `/@`) directly in the capture field to create a flagged capture.

Signals surface in your Console view under the Signals panel, so you can find everything you've flagged in one place.

### See what needs your attention

Console organizes your workspace into four panels:

**Re-entry** — Recent items you were working on. Picks up where you left off: open drafts, recent reads, things you touched but didn't finish. Maximum 7 items.

**Signals** — Everything you've flagged with `/!`, `/~`, `/?`, or `/@`. Also surfaces any content you've flagged for re-reading.

**Orientation** — Your active initiatives and group memberships, with a capture count for each. Helps you see where your attention is distributed across projects.

**Stewardship** — The items that need a decision: drafts you haven't touched in 30+ days, overdue reminders, and open questions with no resolution. These are the things that silently wait.

### Promote a capture

When a capture deserves a more permanent home, promote it:
1. Open the capture.
2. Tap Promote.
3. Choose a destination: a List or an Initiative.

The capture is linked to its new home, and you can still find it in your history.

### Browse your WorkTable

WorkTable is the full stream of your activity — captures, notes, prose, and all your flagged content — in one scrollable view.

- Scroll to browse your full history.
- Filter by type or time range.
- Archive entries you no longer need.
- Delete entries that were noise.

---

## Current limitations

- **Group captures** — Captures are currently personal only. Group-level capture and shared signal views are planned but not yet built.
- **Voice capture languages** — Transcription is English only in the current release.
- **Promote destinations** — You can currently promote captures to Lists and Initiatives only. Library items and other destinations are planned.
- **Signals on external content** — Signals currently work on Mixtape content only (drafts, initiatives, notes). Signaling external URLs is planned.

---

## Related features

- **Initiatives** — Where captures go when they grow up. Initiatives hold the structured work that Console's orientation panel surfaces.
- **Writing** — Drafts that have been stale for 30+ days appear in your Stewardship panel.
- **Puddlejump** — Your personal file library. Future: captures can be promoted directly to library items.

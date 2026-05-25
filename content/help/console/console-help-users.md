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

## Layout

Console uses a two-column layout:

**Main column** — The command field at the top, followed by a two-pane work surface: the left pane holds the active AI panel (when a Generate tool is open), and the right pane shows your activity stream. A collapsed orientation strip sits below.

**Right sidebar** — Three boxes: Activity (recent captures and initiative activity), Generate (the AI tools), and Stewardship (items needing a decision).

---

## What you can do

### Capture something quickly

1. Open Console from the navigation.
2. Type in the command field. Console auto-detects what kind of capture you're making based on how you phrase it:
   - "Fix the login page timeout" → `fix`
   - "Need more context on this" → `need_more`
   - "Remind me to follow up Monday" → `remind`
   - Anything else → `note`
3. Submit — your capture lands in your personal queue.

You can also capture by voice: tap the microphone icon, speak, and Console will transcribe and parse what you said into one or more captures automatically.

### Use the command field slash syntax

The command field understands several `/` shortcuts when you're working in an initiative context:

| Shorthand | What it does |
|-----------|-------------|
| `//[name]` | Switch context to an initiative (search by name) |
| `/.` | Return to personal context |
| `/log [text]` | Post a prose log entry to the initiative's aperture log |
| `/handoff [text]` | Post a handoff entry to the log |
| `/emph [text]` | Post an emphasis note to the log |
| `/n [title]` | Create a new initiative with that title |

### Switch context between personal and initiative

The context switcher at the top of the main column lets you toggle between your personal workspace and any initiative you're a member of. When you switch to an initiative:

- The stream switches from your personal DigestStream to the initiative's ApertureLog
- Captures and log entries you write go to the initiative

Use `//[initiative name]` in the command field to switch by typing, or `/. ` to return to personal.

### Use signals

Signals let you flag content for follow-up from anywhere in Mixtape — a draft, an initiative, a conversation thread.

To apply a signal:
- Use the signal menu on any piece of content, or
- Type the signal notation (`/!`, `/~`, `/?`, `/@`) directly in the capture field to create a flagged capture.

Signals surface in your Console view under the Signals panel, so you can find everything you've flagged in one place.

### See what needs your attention

The Activity sidebar panel shows recent captures and initiative events.

**Stewardship** — Items that need a decision: drafts you haven't touched in 30+ days, overdue reminders, and open questions with no resolution.

**Orientation** (collapsed strip in main column) — Your active initiatives and group memberships, with a capture count for each.

### Use the Generate tools

The Generate section in the right sidebar gives you access to Switchboard's AI verbs directly from Console. Click any tool to open it in the left pane of the work surface:

| Tool | What it does |
|------|-------------|
| **Draft** | Generate a first draft from a prompt. Choose content type (email, message, SOP, document, proposal, summary), tone, and length. Runs locally by default; cloud requires approval. |
| **Refine** | Polish or restructure existing text. Paste content in, describe the change you want, and choose a style. |
| **Add to list** | Add a batch of items to an existing library list using natural language input. |
| **Find in library** | Semantic search across your Puddlejump library. Enter a question or phrase; returns ranked matches with relevance scores. |
| **Research** | Look up information from external sources and get a structured response. Always runs locally — no cloud dispatch. |
| **Pattern** | Identify recurring themes, structures, or gaps across a set of text inputs. |
| **Synthesize** | Combine multiple inputs into a single coherent output with a narrative structure. |

Clicking a tool a second time closes it and returns the work surface to empty.

### Approval modes for cloud operations

Draft and Refine can run in cloud mode for higher-quality output. When cloud dispatch is required, you'll see an approval prompt with three modes:

| Mode | Behavior |
|------|---------|
| **Standard** | Review and approve before each cloud dispatch |
| **Reviewed** | One-tap approval; you confirm but don't review the full payload |
| **Trusted** | Auto-approve; dispatches without pause |

Your approval mode preference is saved per browser.

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

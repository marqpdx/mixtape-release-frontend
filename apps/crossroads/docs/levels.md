# Crossroads Participation UI Patterns

## Brainstorm, Design Rationale, and Build Instructions

> **Status:** Working design & implementation notes
>
> **Purpose:** Explore and document clear, humane UI patterns that help people understand the differences between:
>
> * Group Participant (invited)
> * Full Crossroads Member
> * Crossroads Maker
>
> This document is intentionally practical. It is meant to be handed directly to Codex or a frontend implementer.

---

## Framing Principles (Non‑Negotiable)

Before patterns, a few guardrails:

* This is **not** a SaaS pricing page.
* The goal is orientation, not persuasion.
* Language should emphasize **responsibility and stewardship**, not status.
* Nobody should feel like they are being “upsold.”
* Visuals should be calm, legible, and revisitable.

If a pattern violates these, discard it.

---

# Pattern A — Role Cards (“Choose Your Path”)

### What This Is

A small set of cards (typically three) that introduce the primary participation modes.

Each card answers:

* Who this is for
* What you can do
* What changes if you step up

This is often the **first visual explainer** a visitor sees.

---

### When to Use

* Top of the About page
* After a short intro (“Crossroads, in 30 Seconds”)
* Anywhere someone asks: *“Where do I fit?”*

---

### Structure

Each card contains:

* Role name
* Short tagline
* Cost label (if any)
* “Good fit if…” (2–3 bullets)
* “You can…” (3–5 bullets)
* Optional scope / responsibility note

---

### UX Strengths

* Friendly and human
* Easy to scan
* Works well on mobile
* Low intimidation factor

### UX Weaknesses

* Less precise than a table
* Some edge cases remain implicit

---

### Implementation Notes

* Use a `SimpleGrid` (1 column mobile, 3 columns desktop)
* Cards should be visually equal — no “featured” tier
* Cost labels should be visually subtle (badge, not headline)

---

### Codex Instructions

1. Create a component `ParticipationRoleCards.tsx`
2. Define roles as a data array (no hard‑coded JSX)
3. Render cards from data
4. Ensure cards stack vertically on mobile
5. No CTA buttons — links only if needed

---

# Pattern B — Capability Matrix (Clarity Table)

### What This Is

A small, explicit grid showing **what each role can and cannot do**.

This pattern ends confusion.

---

### When to Use

* Immediately after role cards
* On a “Membership” or “How participation works” page
* When users are comparing options

---

### Structure

* Rows = capabilities (8–12 max)
* Columns = roles
* Cells = `Yes`, `No`, `Group only`, `Limited`, etc.

Avoid icons unless meaning is crystal clear.

---

### UX Strengths

* Extremely clear
* Reduces support questions
* Encourages informed choice

### UX Weaknesses

* Can feel “product‑y” if overdone
* Needs restraint

---

### Implementation Notes

* Horizontal scroll on mobile
* Keep labels human (“Create Circles”, not internal feature names)
* Add a short footnote explaining terms like “Limited”

---

### Codex Instructions

1. Create `ParticipationCapabilityTable.tsx`
2. Define capabilities as data (label + per‑role value)
3. Render as semantic `<table>` using Chakra primitives
4. Ensure table scrolls horizontally on small screens
5. Cap at ~10 rows

---

# Pattern C — “What Changes When You Step Up” Callouts

### What This Is

A sequence of callouts that explain **transitions**, not tiers.

Examples:

* Invited Participant → Full Member
* Full Member → Maker

---

### When to Use

* After explaining roles
* When reinforcing the reciprocity model
* As inline callouts within longer prose

---

### Structure

Each callout answers:

* What you gain
* What responsibility you’re taking on
* What you’re contributing back to the ecosystem

---

### UX Strengths

* Strong alignment with values
* Avoids transactional framing
* Helps people self‑select

### UX Weaknesses

* Not sufficient alone
* Needs context from other patterns

---

### Implementation Notes

* Use subtle background boxes or side‑borders
* Keep copy short (3–4 lines)
* Avoid verbs like “upgrade” or “unlock”

---

### Codex Instructions

1. Create `ParticipationTransitionCallouts.tsx`
2. Hard‑code two transitions initially
3. Style as neutral informational callouts (not alerts)
4. Place after the capability table or within prose sections

---

# Pattern D — Participation Ladder / Stepper

### What This Is

A vertical progression showing how people often move through Crossroads over time.

This is a **storytelling pattern**, not a pricing tool.

---

### When to Use

* Deeper “How Crossroads Works” pages
* Onboarding flows
* Educational contexts

---

### Structure

1. Invited Participant
2. Full Crossroads Member
3. Crossroads Maker

Each step includes:

* Short description
* Typical motivations
* Capabilities unlocked

---

### UX Strengths

* Narrative and reassuring
* Reduces fear of “choosing wrong”
* Encourages organic growth

### UX Weaknesses

* Less skimmable
* Not ideal for quick comparison

---

### Implementation Notes

* Vertical layout works best
* Use numbered steps or subtle connectors
* Avoid language of hierarchy or prestige

---

### Codex Instructions

1. Create `ParticipationLadder.tsx`
2. Use a vertical `Stack` with numbered sections
3. Keep copy concise
4. Do not imply inevitability — this is a common path, not a requirement

---

# Recommended Combination (v1)

For Crossroads right now:

1. **Role Cards** (Pattern A)
2. **Capability Matrix** (Pattern B)
3. **One Transition Callout strip** (Pattern C)

The ladder (Pattern D) can come later if needed.

---

## Placement Guidance

Best default placement on the About page:

* Intro text
* **Role Cards**
* **Capability Matrix**
* Transition callout
* Deeper prose

This balances clarity with warmth.

---

## Final Note

These patterns are not about selling.

They are about:

* reducing confusion
* making responsibility legible
* honoring different ways of participating

If implemented with restraint, they will scale with the community — without distorting it.

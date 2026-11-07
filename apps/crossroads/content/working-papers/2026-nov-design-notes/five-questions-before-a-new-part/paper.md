---
title: Five questions before a new part
version: '1.0'
date: '2026-11-01'
summary: 'Every named part of Mixtape answers five questions before it settles: is it a way in, a place to work, a tool that travels, a layer under everything, or a running process? It keeps the system from sprawling one reasonable step at a time.'
names: '*Argus* is Mixtape''s audit practice; *Daedalus* is research; *Catalyst*, *Hildegard* and *Folio* are parts that each needed placing after they were named.'
status: ratified
types:
- name: Main Gateway
  meaning: Where people cross in.
- name: Surface
  meaning: Where you do things.
- name: Toolset
  meaning: It travels.
- name: Layer
  meaning: It runs alongside everything.
- name: Server
  meaning: A running process.
---

## The principle

Every named part of Mixtape answers to the five groupings before it settles. When something new turns up (a service, a screen, a toolset, an idea with a name), ask the five questions first. Don't invent a category, and don't promote it on the strength of how important it feels.

| Grouping | The question |
|---|---|
| **Main Gateway** | Where do people cross into Mixtape? |
| **Surface** | Can you do things there? |
| **Toolset** | Does it travel? |
| **Layer** | Is it ubiquitous, running alongside everything? |
| **Server** | Is it a running process? |

A part can answer yes to more than one question. Each yes is a separate role: Catalyst is a Main Gateway, a Surface and a Practice. Practices and Disciplines run across the groupings rather than being groupings themselves.

## Why

- **Sprawl comes in one reasonable step at a time.** Each new category looks justified on the day it's added. Ten of them later, nobody can say what kind of thing anything is. The five questions are cheap to ask and expensive to skip.
- **Fewer is truer, at the top most of all.** Alexander's pattern is the *Main* Gateway, not any gateway (*A Pattern Language*, 53). Three is the number that keeps the word meaningful. The Daedalus question showed this: research is real work that many people start with, and still they cross in through Crossroads and use Daedalus as a service (CTO, 2026-10-29).
- **A name isn't a category.** Naming something says what it is, not what kind of part it is. Hildegard, Daedalus and Folio each needed placing after they were named.
- **The maps depend on it.** The System Map draws Main Gateways, Servers and Layers; the Platform Map draws Surfaces and Toolsets. A part with no grouping has no place on either map, which is usually the first sign that something has drifted.

## How to use it

1. **Ask all five, and write the answers down.** The yeses, with one line each on why, go in the part's hand-touch glossary entry. Where there is no entry yet, they go in the spike or ADR that introduces the part.
2. **Look for a sibling before a slot.** If the new part answers the same questions as an existing one, ask whether they're one thing (Spike Reconnaissance Protocol, *Sibling discipline*).
3. **If it fails all five, stop.** Either it isn't a part (it may be a Practice, a Discipline, a feature of an existing part, or an idea not yet built), or the frame is missing something. Either way that's a fork for the steward, not something an agent decides.
4. **Promotion has a trigger.** A part moves up a grouping, for example a Surface to a Main Gateway, only when the trigger is written down and it fires. Daedalus's is written down: a client needs a research product that people sign up for directly.
5. **Words with a whiff wait.** A new grouping word that suggests something it shouldn't is held until the need is real. "Side door" is held because it hints at getting round the rules (CTO, 2026-10-29).

## Who enforces it (proposed)

Enforcement at three points, each light:

- **When a part is born: the agent proposing it.** One line added to the Spike Reconnaissance Protocol and to `CLAUDE.md`: any spike, build plan or ADR that names a new part answers the five questions in its text. The hand-touch settlement records the answers before the entry is ratified.
- **Periodically: Argus.** A check in `doc-vetting-01`, or a small block of its own (`groupings-01`). It confirms that every part on the System and Platform Maps and in the two registries (`system-topology.md`, `mixtape-surfaces.md`) has a grouping, that the maps and registries agree, and that no grouping word has appeared outside the five.
- **Deciding: the frame's steward.** The CTO today. They decide forks (a part that fails all five, a promotion, a new grouping) and own the frame's wording. As with `mixtape-infra`'s roles, the steward is named in one place so the role can be handed to someone else.

## Open

- Is the Argus check a line in `doc-vetting-01`, or its own block? I recommend its own small block: the check is mechanical and runs well on its own.
- Should the five questions be printed on the System Map's Map key? They are close to it already.

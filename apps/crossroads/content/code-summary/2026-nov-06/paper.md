---
title: 'Code summary: ideas that became code, Oct 16 – Nov 6, 2026'
version: '0.9'
date: '2026-11-06'
summary: This summary denotes about 350 commits of code across six repositories in three weeks, nearly all traceable to a document written first. Twelve threads, each followed from idea to decision to what got built. It ends with what deliberately didn't become code. These are offered as examples of current work efforts now underway.
status: draft
---

Nov 6, 2026 · Puddlejump · working paper, draft · sources: git history of each repo, `build-log.md`, the status files named below

## The span in numbers

Three weeks, one CTO, and a handful of AI build agents working in parallel, each in its own repo and session, coordinated through Puddlejump (the decisions record).

| Repo | What it is | Commits |
|---|---|---|
| `mixtape-release-core` | Django back end | 83 |
| `mixtape-release-frontend` | the web apps (Mixtape, Crossroads) and mobile | 166 |
| `mixtape-infra` | server provisioning (Ansible, started Oct 28) | 82 |
| `mixtape-release-switchboard` | the routing and MCP layer | 13 |
| `mixtape-release-stackroom`, `-inkwell` | search and canon; local models | 3 |
| `crossroads-puddlejump` | decisions, positions, specs, records | 484 |

About 350 commits of code and configuration, and nearly 500 to the written record. Most code commits trace to a document written first: a position paper, design note, spike or ADR. The threads below follow that path: **the idea → what was decided → what got built**.

## Names you'll meet

Mixtape names its parts. One line each, in the order they appear:

- **Mixtape**: the platform, for people and groups building knowledge with AI. **Crossroads** is its public site and community.
- **Puddlejump**: the written record of decisions (positions, specs, design notes) that the code is checked against.
- **ADR**: an Architecture Decision Record, a decision written down and ratified before it's built.
- **Service Trust**: the plan that makes every AI and outside call private, consented and recorded.
- **Atrium**: where a person thinks with AI. **Dialogues** are those exchanges; an **Initiative** is a stretch of purposeful work that holds them.
- **Heddle**: the shared service that reads a person's material and proposes what it finds.
- **Folio**: a curated collection around a topic; fiction is its first kind. **Sightings** are Heddle's proposals, kept or discarded by a person.
- **Contour**: the library of shapes and reading strategies the readers follow.
- **NER**: named-entity recognition, finding people, places and things in text. **spaCy**, **GLiNER** and **Qwen** are small models we can run ourselves.
- **Ariadne**: asks questions of our whole body of documents and answers with citations.
- **Switchboard**: the single governed door through which AI agents reach Mixtape's tools (via **MCP**, the Model Context Protocol). **Stackroom** is search; **Meridian** maps the code.
- **Shuttle**: governed capture, from a voice note or phrase to a placed idea.
- **Inkwell**: where local models run. **Catalyst**: an organization's canon (mission, principles and the like).
- **Ansible**: the tool that sets up servers from code.

## 1. Your data goes where you say: Service Trust

**Idea.** *Where Your Data Goes* (charter, ratified Oct 27): AI work for a person runs on that person's own AI account, with no tools unless named, and leaves a record of what was asked, under whose consent and what came back. *Spike: person-owned cloud AI runtimes* came first; *Service Trust* is the build plan.

**Built.**
- Every Claude Code run locked down: no tools unless named, an empty scratch directory, no MCP, hooks or saved sessions (Oct 27).
- A CI rule that fails on any new cloud SDK import, any direct Claude or Codex launch, or any unlisted outside host (Oct 27).
- **Person runtimes:** connect your own Claude account from Settings, sign in by pasting a code, check and disconnect it; a runtime queue and worker run each person's calls (Oct 28 – Nov 3).
- LinkedIn introductions, Catalyst and Shuttle's reading moved onto the starter's own account (Nov 3); Atrium's Dialogues followed (Nov 4).
- **Part C** (Nov 5): the runners now refuse to run without a person's runtime, and CI checks that every call names one.

**Why it matters.** A principle, ratified, became a property the code enforces and CI checks, so it can't quietly erode.

## 2. Think with AI inside an Initiative: Atrium Dialogues

**Idea.** AI work happens in **Dialogues** that belong to an **Initiative** (a stretch of purposeful work); every member has a default, Initiative Zero. Settled in the CTO's terminology (Nov 4).

**Built** (Nov 4–5): Dialogues written on the owner's own account and followed live; Initiative Zero; the memory belongs to the Initiative, so every Dialogue in it opens with it; *Compact* leaves a visible, editable checkpoint that later replies start from; full-text search across Dialogues; a "Who replies" picker (Claude or Codex, per reply). The old ApertureLog was renamed InitiativeLog throughout.

## 3. Reading for meaning, locally first: Heddle, Folio and NER

**Idea.** One shared interpretation service (*Heddle*, ADR ratified Oct 23) reads a person's material and proposes what it finds (people, places, scenes) as **Sightings** a person keeps or discards. *Spike: Sightings and Provisional Data* settled that kept Sightings become one provisional layer, not several. *Folio Interpretation* (ADR) applies it to writing, fiction first. The NER research spike and its findings asked how much of this a small local model can do.

**Built.**
- Heddle's shared interpretation lifecycle extracted (Oct 23); ordered readings and versioned Contour validation (Nov 3).
- The hand-off: kept Sightings become ProvisionalData (Nov 1).
- A Fiction reading Strategy and a source-preserving reading adapter; Folio context and atomic Sighting decisions (Nov 4).
- **Local evaluation, in steps:** reviewed test cases (M1, Nov 3); spaCy and GLiNER compared on finding mentions (M2, Nov 4); a GLiNER baseline for classifying them (M3, Nov 4); approved cases frozen and a small local Qwen model added as comparator (Nov 6). Each model is vetted first for sane output on trivial input, a rule written after a broken model file was once mistaken for an unfit model.

**Why it matters.** The writing about meaning-making (what a "scene" or a "character" is in someone's notes) is being turned into test cases, then into measurements, before any model is trusted with it.

## 4. Decompose now, localize later: the cloud-generation core

**Idea.** *Decompose now, fulfill via cloud, localize through continual refinement* (position, ratified Nov 5): break AI work into small, well-defined steps; let a cloud model do the steps a local one can't yet, on the person's own account; move steps local one at a time as local models catch up. The companion note splits Ariadne's Inquiry Draft into many small per-theme calls. *Further Refinement* names the habit of noting how an ask could be better.

**Built** (Nov 5): one shared cloud-generation core for Heddle and Ariadne (stateless, no tools, JSON checked against a schema); Draft's per-Inquiry consent recorded against each call; every cloud call may return a one-line note on how its own ask could be improved, saved with its record. A table (*Step–Model Fit*) tracks which steps run where.

## 5. A living body of knowledge: Ariadne

**Idea.** *A Living Avatar of Our Knowledge Body* (position, working): our accumulated documents can be asked questions, and answer with citations, not just be stored.

**Built** (Nov 3–5): a curation workbench and Concept lookup (P6); embeddings and hybrid search (P8); **Inquiry Runs** that produce a cited Review (P9), with workbench screens for each; Draft's cloud consent in the UI.

## 6. AI tools that know where they are: Switchboard as the MCP layer

**Idea.** The *Switchboard MCP* ADR: AI agents reach Mixtape's tools through one governed door, with per-runtime tokens, a tool registry that says what each tool is for and whether it only reads, and graceful failure.

**Built** (Nov 2–3): an authorize endpoint and graceful degradation; registry tool definitions; `/mcp` mounted with bearer tokens and telemetry; the canon search tools, scoped to a Group's bundle when the token names one; Meridian's code-graph tools registered; MCP tokens minted, revoked and managed from Settings; Stackroom bundles keyed by sponsor.

## 7. Capture, governed: Shuttle

**Idea.** The *Shuttle* ADR and the *Governed Verb Envelope*: a capture (a voice note, a phrase) is interpreted, previewed, and only then placed, in one confirmed step. *Stories Not Yet Told* gives unplaced ideas a home.

**Built** (Oct 18–23): Place split into Location and Place; name normalizing and near-duplicate matching; the packet contract with JSON Schema; the envelope's plan, preview and one-transaction confirm; IdeaTuple, the holder for stories not yet told; the Shuttle verb over Sightings; a mobile capture-and-review pilot; local interpretation in Inkwell; the cloud gate in Switchboard; publication recovery.

## 8. Unique within your own sphere

**Idea.** "Very few things are unique across the whole system" (CTO, Oct 23): names and slugs are unique within a member's or a group's sphere.

**Built** (Oct 23–Nov 5): Folio adopts the shared sponsor-scoped base, with stable slugs and history; fixes where sponsor lookups had been failing (Bazaar stalls, DOCX import); every ProvisionalData record has a sponsor, enforced by a database constraint.

## 9. Explaining the platform: the maps

**Idea.** The system topology and the *Platform Map v2* (an airport: an information desk and four concourses); the *Five groupings*; the Practices; the *Knowledge Map*.

**Built** (Oct 17–30, about 70 Crossroads commits): the System Map kept in step with its source document through 23 versions (v2.0.18 to v2.0.40); Platform Map v2 with a 20-second scan and a 20-minute deeper layer for every part; the Practice Map; two drafts of the Knowledge Map, following a family recipe through nine stations.

## 10. Fewer, clearer surfaces; better writing tools

**Built** (Oct 17–28): two passes consolidating member pages (one Settings, one profile route, retired pages removed); editor image captions, sizing and wrapping; Export to Markdown; View source as Markdown, HTML and JSON; editing the AI's LinkedIn introduction in place.

## 11. Servers by hand first, then as code: a new server

**Idea.** *Manual first* (design note, ratified): know a step by doing it before automating it.

**Built** (Oct 28 – Nov 6, `mixtape-infra`, 82 commits): each server step done by hand, recorded, then encoded as a guarded Ansible role (PostgreSQL first, then core checks and RabbitMQ); a shared terminal workspace for the human and agents on the new server.

## 12. How the agents work together

**Idea.** Several AI agents and one human working at once need written rules, not habits (CTO, Oct 23 onward).

**Built:** the rules live in each repo's `AGENTS.md` and `CLAUDE.md`: updates go through a committed inbox; one writer per shared log; briefs for an agent are written, approved by the CTO, and then picked up; commits list only their own files. The record is the coordination.

## What didn't become code (yet)

Kept on purpose as positions or Further Refinements: the Layered Corpus and Human Activity white papers (argument, not features); *Cadence of Knowledge Building*; *Curatorial Ownership at Scale*; the Knowledge Map beyond its drawings; moving cloud steps local (watched in *Step–Model Fit*). Working Papers themselves began this week as the smallest version that works: an unlisted packet, a TL;DR, the paper, and a way to answer it.

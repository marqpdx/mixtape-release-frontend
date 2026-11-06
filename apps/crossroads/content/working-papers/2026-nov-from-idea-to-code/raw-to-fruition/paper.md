---
title: Raw to Fruition
version: '0.9'
date: '2026-10-30'
summary: 'How Mixtape helps people carry an idea from raw capture to something that happens: five realms that hold knowledge by purpose, one gathering pattern for collections and outcomes, and an attention mechanism that keeps what matters alive without deadlines or backlogs.'
---

Oct 30, 2026 · @ml

Mixtape tracks idea streams and helps people act on them. This paper sets out how: five realms that hold knowledge by purpose, a shared binder pattern for gathering, and an attention mechanism that keeps what matters alive without urgency.

## Five realms

Realms make knowledge building easier to think in. Each is a place with its own focus, where related things sit close together, the way related ideas do in the mind.

*Sidebar (Nov 1): consider Auditing and Memory as possible pillars.*

A realm must earn its place three ways: cognitive closeness, its own rule of change, and its own gate. Anything that differs on none of these is a Folio, not a new realm.

| Realm | For | Rule of change | Gate |
| --- | --- | --- | --- |
| Initiatives | Acting on ideas | Fluid; honed and merged | A person decides; keepers ask |
| Folios | Curating research | Accumulates | A curator |
| Catalyst | Canon, the source of truth | Amended deliberately | Ratification through Puddlejump |
| History | The witnessed record | Never altered, only annotated | Having been there when it happened |
| Practice | How things are done; the Shape Library | Evolves through use, versioned | Proven in practice |

People are not a realm. They are filaments running through all five, described by what each person chooses to share, their interests, and what they have been part of. Each person holds the end of their own thread: they see their own map, edit it, and hide parts of it. No rankings, no scores.

Crossroads, where people talk and publish, sits alongside the realms; its relationship to them is still open.

## The binder pattern

Folios and Initiatives are the same shape with different orientations. Both are gathering spots around an idea stream.

- **Shared shape.** A center (the idea), members held by reference, conversations, lineage, and sibling links.
- **Folio: oriented to a collection.** A focused, well-kept library around a significant topic. The natural history cabinet.
- **Initiative: oriented to an outcome.** Things gathered so that something happens.

Conversations become their own objects. An Initiative has a primary conversation and sub-conversations, each a turn-by-turn record between a person and an agent. The Initiative is not a transcript; it is the binder that holds them.

Scale emerges rather than being declared. A two-question burst and a months-long effort are the same object at different sizes. Nothing is sized up front.

Catalyst is built differently. A binder gathers around one idea; Catalyst spans the whole endeavor behind a ratification gate. Binders feed it rather than resembling it. Ariadne's inquiry construct can still run over Catalyst, possibly as an add-on.

## Raw to fruition

Every action traces back to the Initiative that asked for it.

1. **Raw capture.** Anything can start it: a Seed, a Shuttle weave, a Folio entry, a Storyline, a Catalyst Codex aspect.
2. **Initiative Zero.** When an idea has no home yet, it starts in Atrium's standing Initiative: no conversation yet, but the whole project context known. Shaping comes later, by late binding.
3. **Initiative base.** Every Initiative has a base that is not a full conversation. It is a guided back-and-forth with its own prompt and context, and one job: move the person into a conversation of their own quickly. A curator who allows no cruft.
4. **Initiative.** Material is promoted in by reference and accumulates as context. Initiatives nest in a strict tree for lineage, with weighted sibling links that a keeper proposes and lets fade.
5. **Orchestration.** Decided requests are uplifted into ADRs in Puddlejump and governed there, linked back to the Initiative. The Initiative keeps ideating.
6. **Findings return.** Results flow home to the Initiative that asked. Clio, as Living Historian, is the natural carrier.

A child Initiative still needs conversation and ideation. Work that is decided and ready to govern is an ADR instead.

## Attention

The question is not what to do next but what deserves to stay alive in someone's mind. Curation runs on attention, rated fast.

- **Three ratings, seconds each.** A keeper surfaces a batch of about ten items; the person marks each hot, medium or cool.
- **Momentum instead of deadlines.** Three hots in a row surfaces in Atrium as information, never a demand. Cools lengthen the interval: every other review, then every fifth, as in a Leitner box.
- **Horizon falls out.** Nobody declares "this week" or "three months"; the pattern of heat reveals it.

The boundary between the active space and History is crossed by attention alone. Five cools in a row and an idea rests in History, kept whole. One hot and it returns to active work. Rekindling adds to the record; it never rewrites what History holds.

### Team attention

Attention can also be asked of a team, separate from betting. Share the organization's needs, then ask each person what deserves the most attention from where they sit. The systems administrator sees a database about to fail. The front-end developer sees most shoppers lost at one step. Both are right, and the team's combined ratings show where attention has gathered before any resources are allocated.

## Keepers, without urgency

The system creates no urgency and builds no backlogs. Nothing is ever in anyone's face. True urgency is a rare exception, reserved for something like a failing backup that should already exist anyway.

- **Anti-sprawl keeper.** Watches new and growing Initiatives and asks whether two share a central idea. It proposes merges and links; a person decides.
- **Sibling keeper.** Proposes horizontal links and lets them fade toward historic as work completes.
- **One review moment.** All keeper proposals arrive together in a batch, at a time the person chooses.
- **No queues.** An unanswered proposal fades rather than piling up. A queue that grows without attention is a design failure.

## Naming

| Thing | Current name | Proposed | Status |
| --- | --- | --- | --- |
| A person's exchange with an agent | ApertureLog | Conversation, or Dialogue | Open: Conversation favored |
| Private messaging between people | Conversation | Chat, under Livewire | Leaning yes |
| Threaded discussion between people | Discussion (Threadworks) | Unchanged | Settled |

ApertureLog is retired: the name is about nine months old and sits too close to Lens. No data depends on it.

## Appendix: Actions

Each action can be worked here or lifted out into its own Initiative.

### A1. Knowledge mapping as proof of concept

The conversation that produced these papers is the model case:

- **Atrium** (root)
  - **Layered Corpus white paper**
    - Stress test: Claim 1 run, findings returned
  - **Raw to fruition**
    - **Knowledge mapping** (lead Initiative)
      - Spike: Spike: Shared Knowledge-Mapping Substrate

* [ ] Stand up Knowledge mapping as the lead Initiative
* [ ] Send the Spike to Puddlejump and track its round trip from the Initiative
* [ ] Replay this conversation inside Mixtape with a Claude Code agent and its persona, and compare

### A2. Initiative Zero and the Initiative base

- [ ] Define Atrium's standing Initiative: blank conversation, full project context
- [ ] Give each Initiative's base its own prompt and context: guided, brief, built to move people on
- [ ] Keep promotion out of Zero a human, late-binding step

### A3. Keepers

- [ ] Define what triggers the anti-sprawl keeper and what it may propose
- [ ] Design the single batched review moment
- [ ] Never merge without a human yes

### A4. Five realms

- [ ] Write a one-line charter for each realm: purpose, rule of change, gate
- [ ] Define how material moves between realms: Folio into Initiative, Initiative into canon, active into History
- [ ] Settle how Crossroads relates to the realms

### A5. Attention

- [ ] Design the ten-item rating batch: hot, medium, cool
- [ ] Set the intervals for cool items and the five-cool threshold
- [ ] Design the team attention round, rated by purview
- [ ] Make sure rekindling leaves the historic record intact

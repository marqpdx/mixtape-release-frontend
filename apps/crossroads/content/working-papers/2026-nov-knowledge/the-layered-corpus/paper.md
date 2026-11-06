---
title: 'The Layered Corpus: Knowledge as IP When Code Gets Cheap'
version: '0.9'
date: '2026-11-01'
summary: 'As AI makes code cheaper to produce, the capacity it frees is best spent on knowledge: five layers (code, how it''s built, how it''s checked, what''s intended, what''s being learned), each IP in its own right. Capture is the bottleneck.'
---

Oct 27, 2026 · @ml

## Abstract

Software used to eat roughly 80% of a technology budget. Today it can take closer to 20%. The code is no less important — it remains the massive, definitive core of a company's IP. What changed is the cost of producing it.

That freed capacity is the opportunity. A team can now invest in many more layers of knowledge alongside the code: how it gets built, how it gets checked, what the team intends next, and what it is still learning. Each layer is IP. Together they form a corpus far richer than a repository.

This paper names five layers, argues that capture is the bottleneck, and asks what a team of 30 could build when every layer is tended. It is written for greenfield teams, where there is still room to build every layer from day one.

## The shift

When code consumed 80% of the budget, everything else was overhead. Design rationale lived in people's heads. Audit was a quarterly scramble. Exploration happened in hallways and vanished. There was no money left to write any of it down.

AI-assisted building inverts that ratio. The 80/20 split is not the interesting detail anymore. The interesting detail is the 60% of capacity that is suddenly uncommitted.

Most teams will spend it on more code. A better bet is to spend it on knowledge: the layers that explain, govern, and extend the code. Code tells you what a system does. The other layers tell you why, how well, what next, and what is still unknown.

## A knowledge spiral, accelerated

Ikujiro Nonaka and Hirotaka Takeuchi described how organizations create knowledge in *The Knowledge-Creating Company* (1995). Knowledge moves between tacit and explicit forms in a spiral of four conversions.

| Move | Conversion | In a layered corpus |
| --- | --- | --- |
| Socialization | Tacit to tacit | People working and talking together |
| Externalization | Tacit to explicit | Speaking ideas aloud to an agent that drafts them |
| Combination | Explicit to explicit | Linking, curating and canonizing across layers |
| Internalization | Explicit to tacit | Learning by doing, captured back as practice |

Nonaka saw externalization as the key move, and for three decades it stayed expensive: someone had to stop and write. AI makes it cheap. A team that can talk its knowledge into the corpus as fast as it thinks spins the spiral faster than any team before it.

Nonaka also named *ba*, the shared space where knowledge is created. An initiative is a ba.

## The five layers

Code is the base. Four knowledge layers sit on top of it, fed by capture and crossed by inquiry.

1. **Code.** Still massive, still definitive. The final word on what the system actually does.
2. **Orchestrator.** The layer that governs building: plans, standards, playbooks, agent instructions, handoffs. It holds the team's knowledge of how things get made here.
3. **Audit and CI.** Tests, reviews, sign-offs and drift checks. It is the review trail: a record of whether the code, and the layers above it, still tell the truth.
4. **Initiatives.** Ideas in flight. What the team intends to do next, and why.
5. **Exploration.** Study and refinement of what is known. This is curation: turning raw findings into trusted knowledge, the team's own body of precedent.

Each layer is IP in its own right. The value compounds where they link: an exploration that becomes an initiative, governed by the orchestrator, shipped as code, verified by audit.

## Capture comes first

Every layer above code starts as a thought someone had at the wrong moment: on a walk, mid-meeting, half asleep. If capturing it takes more than a few seconds, it is lost. Capture is the bottleneck for the whole corpus.

So the front door is a mobile app built for two things:

- **Rapid, super-reliable capture.** Voice, text, or photo, saved instantly, never dropped, even offline. Reliability is the feature; a capture tool that loses one thought loses trust.
- **Early curation.** A light touch at the moment of capture: which layer, which initiative, keep or discard. Not full classification — just enough that nothing lands as an orphan.

Curation stays human. A system can suggest where a capture belongs. Only a person confirms it.

## Inquiry: following the thread

Ariadne is not a lookup. It is living tissue running through the corpus: conduits between layers, current moving along them, memory laid down wherever a question has passed.

The myth gave Theseus one thread through the labyrinth. Ariadne is that thread grown into a nervous system. Follow a question from an idea to the initiative it became, the code that shipped and the audit that checked it, and every pass strengthens the path for the next person.

This is where time enters. Each inquiry leaves a trace, so the corpus remembers how it has been explored, not just what it holds. Code remains the ground truth. Ariadne makes it navigable, and alive.

## From idea to action

Knowledge becomes IP when it can become action, and every action should trace back to where it was asked for.

1. **Capture.** Anything can start it: a voice note, a research clipping, a passage of canon.
2. **A starting place.** An idea with no home yet starts in a standing workspace that already knows the team's context. It is a guided exchange whose job is to move the idea into a home of its own quickly. Shaping comes later.
3. **Initiatives.** Material gathers around an intended outcome. Initiatives nest in a strict tree for lineage, with lighter links between siblings that fade as work completes.
4. **Orchestration.** Decided work is lifted into governed records and carried out, linked back. The initiative keeps thinking while the doing runs.
5. **Findings return.** Results flow home to the initiative that asked.

### Attention, not urgency

What keeps an idea alive is attention. A short batch review asks a person to rate a handful of items hot, medium or cool, a few seconds each. Hot streaks surface. Cool items come around less often, on lengthening intervals, like a Leitner box in spaced repetition. Five cools and an idea rests in the archive, kept whole; one hot brings it back.

Nothing is deleted, nothing is urgent, and no backlog builds. The same review asks whether two initiatives share a center, so ideas merge instead of sprawling. Across a team, ratings given from each person's vantage show where collective attention has gathered before any resources are committed.

## Why now

Two things arrived together: capacity and tooling.

- **Capacity.** Budget once locked into writing code is free to fund the layers around it.
- **Tooling.** Models can now transcribe, summarize, link, and retrieve across thousands of documents. Tracking five layers by hand was impossible. Tracking them with assistance is routine.

What the tooling does not supply is judgment. Machines can propose links between layers; people decide which ones are true. That human confirmation is what turns a pile of notes into IP someone can stand behind.

## Where this applies

The layered corpus pays off most where there is headroom. A mature system run by a seasoned team for years already holds its knowledge in people and process. There is little left for AI to unlock, and the evidence shows it: the weakest gains appear among veterans working in codebases they know by heart.

Greenfield is different. A young system has no legacy to reverse-engineer, so the layers can grow up alongside the code instead of being reconstructed later. Building there is generative, not remedial.

Three conditions mark the sweet spot:

- **Young or greenfield systems.** The code is still being shaped, and the methodology can be shaped with it.
- **Small, high-velocity teams.** Up to about 30 people, where one person's insight can reach everyone within a day.
- **Domains where provenance matters.** Work where "why did we decide this?" has a real answer someone must stand behind: legal, education, finance, health. In these fields, an attributable decision trail is not overhead. It is the product.

The savings follow the practice, not the tools. Teams that learn to build this way can cut the cost of writing code dramatically. Most teams have not learned it yet, and that gap is the opportunity.

## A team of 30

Picture 30 people, each capturing a few thoughts a day into the right layer. Within weeks the team holds a living record of why every major decision was made, what was tried, and what remains open. New hires read the trail instead of interrupting the veterans. Departures stop erasing memory.

The multiplier is cross-layer. One person's exploration note informs another's initiative. An audit finding feeds back into how the orchestrator governs the next build. Thirty people tending five layers is not 30 separate notebooks; it is one compounding corpus.

That corpus is the moat. Code can be rewritten. Accumulated, curated, attributable judgment cannot be copied quickly.

## Risks and open questions

- **Noise over signal.** More capture can mean more clutter. Early curation and a clear discard path have to be as easy as capture itself.
- **Layer drift.** Initiatives and explorations can fall out of sync with the code. The audit layer must check the knowledge layers, not just the code.
- **Adoption.** People will not migrate off their tools before they see payoff. Capture has to work alongside what they already use.
- **Ownership of the corpus.** Who stewards each layer at 30 people? Named owners, or shared stewardship with rotation?

Open questions to carry forward:

- [ ] Is five the right number of layers, or do capture and inquiry deserve their own?
- [ ] Where does Ariadne live: inside the exploration layer, or across all layers?
- [ ] What is the minimum viable mobile capture flow?
- [ ] How do we measure the corpus's value to a team?

## Appendix: Stress test

This paper is an idea in motion. The stress test is how it moves: each claim gets tested, and the paper is revised by what the tests find. Time is the fourth dimension of the argument.

The claims below are run in parallel with the paper and their findings published alongside it.

| # | Claim | How we test it | What would break it | Status |
| --- | --- | --- | --- | --- |
| 1 | For greenfield teams that learn the practice, code's share of budget can fall from \~80% toward \~20% | Gather published data and our own build costs before and after AI-assisted development | Savings far smaller, or offset by review and maintenance costs | Not started |
| 2 | Freed capacity can fund knowledge layers instead of more code | Ask teams where their reclaimed time actually went | Reclaimed time is absorbed by feature work by default | Not started |
| 3 | Capture is the bottleneck | Pilot the mobile capture app with a small team; track captures per person and lost captures | People capture freely in existing tools; the gap is elsewhere | Not started |
| 4 | Early curation keeps noise down | Track how many captures end up orphaned or discarded after a few weeks | Orphan rate stays high despite curation at capture | Not started |
| 5 | Five layers are the right cut | Sort a sample of real captures into the layers; count the misfits | Many captures fit no layer, or fit several equally | Not started |
| 6 | Inquiry trails compound in value | Give a newcomer "why" questions; compare answering from trails versus asking people | Trails are slower or less accurate than asking | Not started |
| 7 | A team of 30 compounds, not just accumulates | Measure cross-layer links as a pilot team grows | Links per capture flat or falling as headcount rises | Not started |
| 8 | The curated corpus is a moat | Ask how long a well-funded rival would need to rebuild it | Comparable corpus can be generated quickly from public or synthetic data | Not started |

### Findings

#### Claim 1: code's share of budget (researched Oct 27, 2026)

**Verdict: does not hold as stated. The revised claim makes the paper stronger.**

- **Measured savings are modest.** Practitioners put AI's real cost reduction at roughly 10–25%, highest on boilerplate and lowest on novel logic ([Vasundhara](https://www.vasundhara.io/blogs/custom-software-development-cost-in-2026-after-ai), [Chop Dawg](https://www.chopdawg.com/how-ai-is-cutting-app-development-costs-and-timelines-in-2026/)). A McKinsey survey reports routine coding time down 46%, but feature-to-production only 28% faster ([Tech Insider](https://tech-insider.org/ai-coding-tools/)).
- **Speed is still contested.** METR's 2025 randomized trial found experienced developers 19% slower with AI. Its 2026 follow-up leaned toward a speedup but was judged unreliable by METR itself ([Conffab on METR](https://conffab.com/?p=10163), [youngju.dev](https://www.youngju.dev/blog/2026-07-12-ai-developer-productivity-reality.en)).
- **Maintenance dominates the budget.** Maintenance is commonly estimated at 60–80% of software's total cost of ownership ([CodeStringers](https://www.codestringers.com/articles/software-maintenance-costs-explained)). Writing new code was never most of the spend.
- **The cost moves rather than vanishes.** Gartner projects AI-assisted development spend per developer could exceed a typical developer salary by 2028 ([FinChannel](https://finchannel.com/ai-coding-could-cost-more-than-hiring-developers-by-2028-gartner-says/131828/american-business-trends/markets/2026/06/)).

**What the evidence supports instead.** The bottleneck is context, not keystrokes. Experienced developers rely on undocumented knowledge of their codebases that AI cannot reach ([Diginomica](https://diginomica.com/node/29061)). A review of both trials concludes AI helps when it supplies missing context and hurts when it has to catch up ([youngju.dev](https://www.youngju.dev/blog/2026-07-12-ai-developer-productivity-reality.en)). Faster coding piles work up against downstream chokepoints: product decisions, review, QA ([O'Reilly](https://oreilly.com/radar/coding-was-never-a-bottleneck)).

That is the case for the layers. The corpus is the context.

**Proposed revision** to the Abstract and The shift: drop the 80%-to-20% figure. Say instead that writing new code has become dramatically cheaper, and the bottleneck has moved to context: the decisions, reviews and knowledge around the code.

**Author's response.** The studies sample large organizations and veterans in mature codebases, where headroom is smallest. The author's own greenfield work has cut code costs by about 80%. That is an existence proof, not an average, and the gap between the two is the paper's point: the savings are learnable, and most teams have not learned them yet. Claim 1 is now scoped to greenfield teams, and the author's before-and-after build costs become its primary evidence.

## Appendix B: Two case studies

Two illustrative organizations show the five layers at work outside a typical software team. Both are small, both run young systems, and both live or die on provenance. In each, "code" means the definitive layer: the systems and records the organization treats as final.

| Layer | Small private school | Fractional legal collective |
| --- | --- | --- |
| Code | Learning platform, curriculum, student records | Clause library, contract templates, matter records |
| Orchestrator | How a course is designed, approved and launched | Review playbooks: what gets escalated, who signs off |
| Audit and CI | Accreditation checks, assessment reviews | The review trail: who approved what, against which playbook |
| Initiatives | A new outdoor science program; a revised grading policy | A new AI-use policy for clients; a revised vendor-contract standard |
| Exploration | Teachers' notes on what worked and what didn't | Research memos, regulatory changes, the collective's own precedent |
| Capture moment | A teacher's voice note walking out of class | A counsel's dictated note after a negotiation call |
| Inquiry | "Why is seventh-grade science built this way?" | "Why did we accept this liability cap for this client last year?" |

### The school

A private school of about 30 staff is moving to a new learning platform. Today, the reasons behind its curriculum live in the heads of a few long-tenured teachers. When one retires, a decade of judgment leaves with them.

With the layers in place, teachers capture a few seconds of reflection after class. Those notes are curated into exploration, feed initiatives like the new science program, and link back to the curriculum they change. A new teacher asking why a unit is built a certain way follows the thread instead of hunting down a colleague.

### The legal collective

Five attorneys serve about 20 growing companies as fractional general counsel. Each lawyer carries their clients' context privately. When one is out, a client's history goes quiet with them.

With the layers in place, every negotiation leaves a dictated note, every approval leaves a trail tied to the playbook it followed, and every position the collective takes becomes precedent it can find again. When a client asks why a term was accepted, the answer arrives with its lineage: who decided, on what basis, and what has changed since.

In both, the corpus outlasts any one person. That is what makes it IP.

## Appendix C: Notes from the field — coherence, and running more agents

These notes come from an active working session on Oct 30, 2026: provisioning servers, and setting up the dispersed pieces of a knowledge system (a code index for agents, a canon of decisions, a way into it, rules for who may act). They aren't argued here; they're what the work looked like from inside, recorded before a fuller paper on the idea lands.

**The idea.** In the agentic age, a team's task is to become continually more coherent, and so be able to run more agents without losing agency and ownership.

More agents is easy to buy. What's scarce is being able to tell, at any moment, what they're working from, what they're allowed to do, what they did, and whose call each change was. Without that, more agents means more noise, delivered confidently. Coherence is what makes "more" safe.

**What it took, layer by layer.** Each piece of the day's work turned out to be one form of coherence:

- **Machines that are declared, not remembered.** The servers are described in versioned files and rebuilt from them. A rerun that changes nothing is the proof the server is what we say it is. An agent can be trusted on a machine whose state is known. (Orchestrator, with Audit.)
- **Action that stays owned.** Every agent acts as a named person, under that person's own account, and each call leaves a record. Adding agents doesn't blur who did what. (Audit.)
- **No reconstruction tax.** An index of the code means agents stop rebuilding an understanding of the system every session. A canon of decisions does the same for reasons. Most of what an unprepared agent spends goes on rediscovering context that should already exist; the name comes from *Infrastructure for the AI Age* (`decisions/positions/position-infrastructure-ai-age.md`, Aug 2026). (Code, with Orchestrator.)
- **Reasons that are findable.** The canon lets a new agent, or a new person, start from what was decided instead of guessing, and the inquiry layer (Ariadne, in the paper's terms) makes the path back to any decision walkable. (Exploration and Inquiry.)
- **Many agents in view.** Named, colour-coded terminal sessions, each with a short resume note and a board showing which are idle, working or waiting on a person. Then one person can keep many sessions in view without holding them all in mind. (Orchestrator.)
- **Human decisions kept where they happen.** Before automating a manual step, ask whether it's friction (mechanical cost) or a seam (a place where a person actually decides). Automate friction; keep seams. Servers follow the same rule: every step is done by hand first, by the person who owns it, and only then written into automation. Agents prepare and record; people decide and run. (Audit, and the paper's "curation stays human".)

**The test.** For any step: *does it let us run one more agent without losing track of what's ours?*

**How it touches this paper.**
- It's the paper's claim about context (Claim 1's finding: "the corpus is the context"), seen from the operator's chair. The layers are what agents work from, so tending them is what lets a small team run many agents.
- It isn't new to this project. The Pattern Library named it in March 2026 as the meta-pattern **Increasing Coherence** (`reference/patterns/patterns-v1.md`): "Every structured pass on a body of material must leave it more coherent than it was found." That was a rule for a single pass over documents; the agentic age makes it a rule for the whole team.
- It adds a sixth thing the layers buy: not only memory and provenance, but the **capacity to delegate safely**.

Possible stress-test claim to add: *a team that tends its layers can run more agents per person without a rise in unowned or unexplained changes.*

---
title: Decompose now, fulfill via cloud, localize through continual refinement
version: '1.0'
date: '2026-11-05'
summary: Split AI work into many small, inspectable steps now; let a cloud model carry the steps a local model can't yet do, on the person's own account and with consent; move steps local one at a time as evidence allows. Local-first, told honestly.
names: '*Heddle* reads a person''s material; *Ariadne* answers questions across a body of documents; *Inkwell* runs local models; *Tier 0* is model vetting''s first sanity check.'
status: ratified
---

## 1. The question

Build a pipeline as many small, bounded, auditable steps — because that is sound architecture regardless of where each step runs (`decisions/ariadne/design-note-inquiry-draft-many-small.md`; Heddle's D3, below). But today's local capacity (the memory on our laptop and servers) cannot run most of those steps well. Two ways to respond:

- **Wait.** Build the decomposed pipeline, but don't ship it until enough steps can run locally to honor Local-First's default. Slower, but never operates in a state that needs explaining.
- **Decompose now, fulfill via cloud now, localize later.** Ship the decomposed pipeline today, with every step's prompt/schema/context materialized as a real, inspectable unit — but let cloud AI, under explicit consent, actually execute some or all of those units for now, while a standing practice measures which units could move local and does so as capacity and evidence allow.

This note argues for the second, within bounds, and names what has to be true for it to not quietly become permanent.

## 2. This is not new — it generalizes an existing, ratified decision

This is not a new principle competing with Local-First. It is Heddle's own already-ratified policy (`decisions/heddle-adr/heddle-adr.md`), generalized beyond Heddle:

> **D3 — The step is the unit.** A reading is an ordered list of steps... finer steps come as measurement justifies them.
>

Heddle already decided: decompose for real, let cloud carry what local can't yet, let the step boundaries be where local capability grows into over time, require evidence (Model Vetting Protocol + same-cases comparison) before moving a step. This note's contribution is three things Heddle's ADR doesn't yet have:

1. **Generalize it beyond Heddle** — to Ariadne's Inquiry Runs now, and to whatever decomposed pipeline comes next, as a named, cross-cutting practice rather than a per-ADR decision made again each time.
2. **Give it a recurring cadence** (§4) — Heddle's ADR says moving a step down "needs evidence" but never says when that evidence-gathering happens. Today it happens only when someone notices, as with this Inquiry run.
3. **Give it a shared, cross-pipeline record** (§5) — a step's fitness for local execution is currently recorded, if at all, inside its own pipeline's build docs. There is no single place to see, across Heddle, Ariadne, and future pipelines, which steps are candidates and which have already been tried.

## 3. What has to be true for this to be sound, not a quiet reversal

**3a. Decomposition must be real at the data level, not just at the dispatch level.** If twenty-four steps get fulfilled by one cloud call that does all twenty-four at once "to move fast," there is nothing left to later localize — no record of twenty-four discrete prompts, just one big one no evidence process can act on. The requirement: each step's prompt, schema, and context must be materialized as its own artifact — logged, inspectable, replayable — even when, for speed today, several of those artifacts are dispatched together in fewer actual network calls. Decomposition-in-shape is required; decomposition-in-dispatch (how many network round-trips it costs) is free to vary with what's efficient right now. `decisions/ariadne/design-note-inquiry-draft-many-small.md` is the concrete instance: Draft's 24 per-theme units are real, separately-checked calls, not a batching convenience.

**3b. Consent stays at the level it's always been, just correctly bookkept.** Nothing about consent changes: every cloud call still needs explicit, documented consent (Local-First, unchanged); nothing here introduces a second kind of permission. What's new is bookkeeping, not permission: one consent event — "run this Inquiry via cloud" — covers all of its decomposed steps, and that event's id is recorded against *each* of those steps' individual log entries, so a later audit can see, per step, which consent it ran under. One ask of the person; many logged, attributable records of what that ask covered.

**3c. Local-First's aim doesn't change; its timeframe does, honestly.** Local-First's three reasons (token economics at scale, the privacy promise, forcing local-tool innovation) are not weakened by this note — they're why the localize-later half exists at all. What changes is the admission that "local-tool innovation" takes time proportional to building a coherent knowledge architecture, not the time of adding one feature. Rather than delay every decomposed pipeline until local capacity catches up, or overclaim present local-only capability to privacy-forward clients, this names the honest middle: decomposed and ready to localize, cloud-fulfilled for now, under consent, with a standing practice (§4) making the "not yet local" set something that is actively measured and shrunk, not a thing anyone has quietly stopped looking at. **Action: add a provenance note to wherever Local-First's governing text lives, recording that this Field Note refines its timeframe (2026-11-05) without changing its aim.** (Blue's search did not find one single ratified doc that is *the* canonical statement of Local-First by that name — `features/switchboard/tooling-local-strategies.md` and Heddle's own Headnotes are the closest ratified anchors found; Puddlejump should confirm the right place for this note, or that one needs creating.)

**3d. This does not touch privacy-forward clients.** A client under a local-only commitment stays local-only, full stop; this note has nothing to say about them and changes nothing for them. What this note is honest about is that the granularity this builds — real, bounded, swappable steps — is exactly what privacy-forward clients will eventually need *served by*, which is itself a reason to build the decomposition now rather than later, even though those clients can't yet be told "and some of this already runs local."

## 4. The standing practice: a monthly two-part Inquiry

Decided (CTO, 2026-11-05): this runs monthly, as a two-part Inquiry (deliberately named after Ariadne's own construct — this is, itself, an Inquiry Run over the codebase rather than over Puddlejump's writing):

- **Part A — current state of all MCP-mediated calling code.** Enumerate every decomposed step across every pipeline (Heddle's readings, Ariadne's Inquiry Runs, whatever exists by then): what it asks, in what shape, how often it actually runs, and under what consent. This is why real decomposition (§3a) is load-bearing — Part A has nothing to enumerate if steps were never materialized as separate units.
- **Part B — which models, available now, could meet each step's need.** For each step inventoried in Part A, run the Model Vetting Protocol's Tier 0 checks against candidate local models, then the same-cases comparison method Folio's NER evaluation already uses (rules/spaCy/GLiNER/Claude as baseline) — not a new evaluation methodology, the existing one, applied per step.

Who runs it: not yet assigned; candidates are Argus (audit cadence already exists, EOD/beta-milestone) or Keeper (stewardship of the living system is closer to its charter than Argus's compliance-audit framing) or a dedicated evaluation role, as NER Eval was stood up for the NER plan. Puddlejump/the CTO to decide; this note does not presume an owner.

## 5. The missing piece: a cross-pipeline step↔model dictionary

Part B's output per step should land in one shared table, not scattered across each pipeline's own build docs. Minimum columns, per the CTO's own framing:

| Column | What it holds |
|---|---|
| Step | The small unit's name, within whatever "knowledge flow between people and AI" it belongs to — **this phrase itself needs defining**; see open question below. |
| Pipeline | Heddle reading step / Ariadne Inquiry Run step / future pipeline, with a link to its own step contract. |
| General model fit | Which model *kinds* (deterministic, small local generative, large local generative, cloud) can plausibly do this step's job at all, independent of our current hardware. |
| Fit given our constraints | Which of those are actually viable today, given present memory/compute (our servers' memory today; laptop numbers are descriptive only) — this is the column that changes month to month as capacity grows. |
| Evidence | Link to the Model Vetting matrix row(s) and the same-cases comparison that justified the "fit given constraints" column, never asserted without a run. |
| Status | Cloud-fulfilled (current default) / piloted locally / moved local / rejected locally with reason. |

**This table's location and whether it reuses or extends an existing registry (Switchboard's tool registry, the Model Vetting matrix, something new) is an open question for Puddlejump, not decided here** — a quick search (this note's own spike) found Catalyst's verb set (Find/Amend/Add, a different granularity — content operations, not AI-processing steps), Heddle's per-pipeline step records (D3, real but not cross-pipeline), and Switchboard's tool registry (SW-11, routes calls but doesn't yet record per-step model-fit evidence) as the closest existing structures, none of which is quite this table today.

**The "knowledge flow between people and AI" phrase needs its own short exploration** before the dictionary's first column is named for real — is a "flow" an Inquiry Run, a Heddle reading, a Shuttle weave, or a level above all three? This note leaves that open rather than guessing.

## 6. Pilots this enables

Once a step is in the table with "fit given constraints" showing a plausible local candidate, that step becomes a pilot: route that one step (1 of N in its flow) to the candidate local model, run it alongside the existing cloud path on the same cases, and A/B the two outputs under the Model Vetting Protocol's comparison method — exactly the method already proven out by Folio's NER evaluation plan, applied here one pipeline-step at a time instead of one NLP-task at a time. A pilot that succeeds moves that step's Status column to "moved local"; Local-First's third reason (forcing local-tool innovation) is now something the monthly Inquiry actively produces, rather than something that happens only when capacity changes on its own.

## 6a. Ask the cloud to help refine the ask (CTO, 2026-11-05)

While a cloud agent does a step we ask of it, we also ask it to help us refine that ask. A pipeline of 24 steps, such as Draft's per-theme calls, starts out cloud-fulfilled with the aim of moving some number of them local. The tighter aim is to keep improving the steps themselves, and the agents doing the work are well placed to notice where an ask is too large, ambiguous, or better split or merged.

So each cloud step may return, beside its result, a short **refinement note** about the step itself: a better split, a tighter prompt, context it lacked or didn't need, a part that looks deterministic or simple enough for a local model. These notes are **Further Refinements** (`design-note-further-refinement.md`): observational, never acted on automatically.

Bounds:
- **Separate from the result.** A refinement note never changes the answer, its citations or its validation, and is never applied to the next run on its own.
- **Optional and short.** One or two sentences, or nothing; never a reason to fail a step.
- **Recorded with the step** (and its consent event, §3b), so the monthly Inquiry (§4) reads them beside each step's evidence and the step table (§5).
- **The person decides.** A note that's taken up becomes a change to the step (a new prompt or Strategy version, a split, a pilot), recorded as usual.

This is how the "not yet local" set shrinks by design rather than by luck: the steps get sharper as they run, and a sharper step is easier to move local.

## 7. Open questions for Puddlejump/the CTO

1. Where does Local-First's governing text actually live, so §3c's provenance note lands in the right place (or needs its own new home)?
2. Who owns the monthly two-part Inquiry — Argus, Keeper, a new evaluation role, or something else?
3. Where does the step↔model dictionary (§5) live, and does it reuse the Model Vetting matrix, Switchboard's tool registry, or need a new shared document?
4. What is a "knowledge flow between people and AI," precisely enough to be the dictionary's unit of reference — is this its own short exploration before the dictionary can be built at all?

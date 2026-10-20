# Shuttle findings contract — approved for implementation

Drafted 2026-10-19. **CTO approval received in this session; recorded 2026-10-20.**
The common fields, six Shape field sets, source-span convention, correction/result
contract, and three-question pilot bound are approved for implementation.
The `_DRAFT` filename is retained for link continuity. This approval does not
itself register the capability, publish canonical Contour artifacts, modify
SH-7a, or waive the runtime and cloud-approval gates before a live run.
Canonical artifacts belong on the Contour shelf through the CTO/Puddlejump workflow.

## What the person receives

One short proposed reading, the evidence for its intended connection, the
things/Places/Ideas/story passages heard, and a small number of useful questions.
The person can correct that reading in ordinary language. Every proposed entity
is a process-bound Sighting. Displaying or agreeing with the reading does not
publish it or create Commons entities. Unconfirmed Sightings evaporate according
to the envelope's transient lifecycle; original Seeds remain private sources.

## Source, identity, and execution

- Core authorizes source access using `request.user` (`users.CustomUser`).
  Source identity, model identity, and resolved database identity are separate.
- Before dispatching the first interpretation, call
  `shuttle.services.start_weave(weave_in=..., author=request.user)` exactly once
  for the accepted request. Preserve the returned envelope id across corrections.
  Bind a caller request UUID to this result for retry/idempotency; do not call
  `start_weave` again for an HTTP retry or correction. The shared function itself
  creates a fresh run on every call, so retry handling belongs around it.
- Each execution has a child `ActionRun.parent_action` pointing at that envelope.
  Only the child becomes running/succeeded/failed for an interpretation attempt;
  leave the parent pending for later packet confirmation. A model completion is
  not completion of the weave's transaction.
- Envelope `tenant_id` remains the platform default. Resolve a Claude runtime
  separately by `TenantClaudeRuntime` tenant `users.CustomUser` with the same
  author UUID. Never substitute the envelope tenant for runtime identity.
- Later call `hold_packet(action_run_id=weave_action_run_id, packet=..., author=...)`
  using that same authorized author. No additional envelope is created.
- SW-9 checks applicable restrictions. Core records the person's explicit cloud
  approval (`cloud_approved`, `approval_payload`) before any cloud dispatch.
  For child execution, bind approval to parent id, execution id, revision, source
  digest, capability, and the data described to the person. Preserve the approval
  record on the execution being checked by SW-9/Core; the parent is its audit
  context, not blanket consent for every future correction.
- No runtime, not READY, or disallowed AI mode is a visible error. There is no
  alternate-user/server-login fallback. No live test until approval recording
  and the CTO's runtime/mode readiness have been verified.

## Proposed common fields on each Sighting

Use the existing Contour convention of Shape fields at the top level, including
`source_locator`. The following is the proposed Shuttle specialization, not a
replacement for all Contour consumers' Sighting formats.

| Field | Type / meaning |
|---|---|
| `sighting_id` | Opaque id unique within the weave; survives a revision only when the same referent is retained. Newly inferred referents get new ids. |
| `shape_id`, `shape_version` | One of the six ids below, pinned to proposed version `0.1.0`. |
| `strategy_id`, `strategy_version` | Proposed `shuttle.weave_to_packet@0.1.0`; present on every Sighting as required by the Strategy contract. |
| `confidence` | `high`, `medium`, or `low`: interpretive confidence, not a calibrated probability or database-match score. |
| `source_locator` | Nonempty list of exact source spans supporting the Sighting, including source reference and immutable source revision. |
| `uncertain` | Required array, empty if none. Entries contain `field`, `reason`, and supporting source spans where available. Never discard unresolved material. |

**Source span:** `{source_ref, source_revision, start, end, quote}`. `start` is
inclusive and `end` exclusive, measured in Unicode code points of the exact
stored source, without normalization. Core verifies that the slice equals
`quote`. Source references resolve only within this author's weave. This avoids
Python/JavaScript UTF-16 disagreement on emoji. Spans prove text fidelity, not
the truth of an attribution or inference.

The original voice transcript is source revision 0 and is never rewritten.
Each typed or transcribed correction is a separate immutable source with its
own reference. Findings revision and source revision are different: a findings
revision can refer to both the original telling and later corrections.

Core stamps execution provenance on the result (child ActionRun id, actual
provider/model where available, prompt version, unit versions, source digests,
and timing/usage metadata). Models cannot assert execution provenance. Retain
source references, not credentials or raw provider logs, in the client response.

## Six Shapes: proposed fields

All listed collections may be empty unless noted; absent knowledge stays absent
or uncertain. Core rejects unknown fields and validates all references.

| Shape id | Shape-specific fields |
|---|---|
| `shuttle.weave` | `reading: string`; `thing_ids`, `place_ids`, `idea_ids`, `adjacency_ids`, `story_ids`: Sighting-id arrays. Exactly one weave Sighting per successful result; one proposed adjacency cluster per weave. |
| `shuttle.thing` | `name_as_said: string`; `proposed_name: string \| null`; `place_ids: string[]`. A proposed spelling/identity is explicitly a proposal, never a `found` match. |
| `shuttle.place` | `name_as_said: string`; `proposed_name: string \| null`; `role: named_place \| locale \| unresolved`; optional `address_as_said: string`. A city/country locale is not an identified venue or a resolved `tapestry.Place`. No inferred address/coordinates. |
| `shuttle.idea` | `wording: string`; `basis: stated \| inferred`; `supporting_sighting_ids: string[]`. Closest existing Ideas come from the resolution unit, not model claims. |
| `shuttle.adjacency` | `ends: [thing_id, thing_id]` (distinct); `reason: string`; `intent_basis: expressed \| inferred_from_intent`; `intent_evidence: SourceSpan[]` (nonempty). Shared cluster evidence may support multiple edges, but merely listing similar things cannot silently establish intended adjacency. |
| `shuttle.story` | `subject_ids: string[]`; `text: string`; `passage: SourceSpan`; `knowledge_basis: firsthand \| heard \| remembered \| unknown`; `completion: complete \| unfinished \| unclear`. `text` must equal `passage.quote` verbatim, including an unfinished ending. Ambiguous subject stays uncertain rather than being silently chosen. |

The successful response is a typed union of those six Shapes. It contains the
original source reference/digest, `weave_action_run_id`, `execution_action_run_id`,
`revision`, pinned contract version, `sightings`, `resolution`, `questions`, and
execution provenance. Proposed wire contract version: `0.1.0`.

`resolution` is a **server-owned** sidecar keyed by Sighting id, containing
authorized candidate `{kind, id, name, score?, method}` records or unresolved
state. Core's matcher and Stackroom retrieval supply it. No model may populate
database ids or assert `found`. Inkwell must not query Qdrant directly.

`questions` contains zero to three `{question_id, text, sighting_ids, reason}`
items, prioritized for material ambiguity. Do not require every question to be
answered before returning a useful reading. The limit is a proposed pilot UI
bound, not a new ADR rule. OQ6's broader director voice remains separate.

No successful response carries publishable-row ids, a Publish instruction,
Linux account information, credentials, or a claim that a packet has been held.
Packet assembly is a later operation using the unchanged SH-7a packet contract.

## Requests, revisions, and result states

Initial interpretation request: caller request UUID, owned source Seed id,
client (`phone`/`desktop`) and capture mode. Core reads the exact ready source,
constructs SH-7a `weave_in` and starts the envelope. Never trust caller-selected
runtime, author, source path, or model. Cloud consent must be recorded before
dispatch; absence of consent may leave the interpretation awaiting approval,
not send it automatically.

Correction request: `{request_id, weave_action_run_id, expected_revision,
correction_text}` or an owned ready correction-Seed reference. Exactly one
correction source is supplied. `correction_text` is stored verbatim. Core checks
initiator and current revision atomically before scheduling. A duplicate request
returns its prior result/job; a stale revision returns `revision_conflict`.
Each accepted correction increments the revision and produces a child run.
Older executions can finish for audit, but cannot replace newer findings.

Proposed result states: `awaiting_cloud_approval`, `pending`, `running`,
`succeeded`, `failed`. Failure codes distinguish `runtime_missing`,
`runtime_not_ready`, `mode_not_allowed`, `policy_forbids_cloud`, `auth_failure`,
`timeout`, `invalid_output`, `source_not_ready`, and `revision_conflict`.
An unauthorized/unknown weave or source is not disclosed to another person.
A failed child leaves the person's capture and pending envelope intact for a
visible retry/correction; no automatic cloud escalation or infinite retry.

Operational status polling should reuse existing ActionRun transport; it must
not return unvalidated model output. HTTP routes, storage details and approval
UI are implementation work after this contract is approved, not a second
findings ontology. Do not register unapproved Shapes as canon.

## Three-choirs worked reading

Use the actual source recorded in this session, not the polished SH-7a fixture.
Expected Shape content for review:

- **Weave:** “I hear three groups connected through singing together. You have
  been to Choir! Choir! Choir! and told one story.” This is a proposed reading,
  not a replacement for the source.
- **Things:** raw `choir choir choir`, `pub choir`, `low bar corral`. Proposed
  names may be `Choir! Choir! Choir!`, `Pub Choir`, and `Low Bar Chorale`, with
  uncertain spelling/identity visible until resolved. No database matches yet.
- **Places/locales:** Toronto (tentative “I think”), Australia (no city), and
  Portland. All are locale/unresolved Sightings here; no venues or addresses.
- **Idea:** “singing together”, stated. No second Idea must be invented to
  match the earlier fixture's counts.
- **Adjacencies:** propose connections between the three things through
  participatory singing. Mark `inferred_from_intent`. Cite “So all three of
  those” and “singing together is the key thing” as shared cluster evidence.
  Do not claim individually stated pairwise reasons or researched facts.
- **Story:** subject is the Choir! Choir! Choir! candidate, knowledge basis
  firsthand, completion unfinished. Preserve this exact source passage:

> it's a great experience. People come together, all the ex choir kids now in their 40s, and their families singing loudly and proudly and having a great time under the...

- **Uncertainty:** tentative Toronto, possible `corral`/`Chorale` transcription,
  unfinished story. No Brisbane from prior context, no “Gathering” merely to
  fill the sample, no stories for the other two groups, and no map placement.
- **Correction example:** “Yes, Low Bar Chorale. Leave the unfinished ending
  as I said it.” Revise the proposed name and that uncertainty only; preserve
  source text and story, and retain connection evidence. This does not provide
  permission to publish or blanket cloud consent.

## Approval record and next step

The CTO approved this contract in response to the requested review. Carry the
pinned Shapes/Strategy to Contour and add shared API/schema artifacts before
registering `shuttle_weave_interpret`. Full canon
Shape companion files and Strategy companions still need to be authored; this
review document alone does not publish them.

# HD-5: decisions before Folio implementation

2026-10-25. Prepared from Blue's handoff, Puddlejump's
`zz/handoff-2026-10-25-mobile-heddle-hd5.md`, ADR-0060 and ratified ADR-0061 v1.0.1.
Recommendations only. The handoff says “Recommend and stop” on OQ1/OQ2.
No Heddle code, cloud dispatch, schema copy or migration is changed by this brief.

## Current checkpoint

Blue built the Reading registry, generic lifecycle/run/apply bodies and Shuttle's
wrappers. Shuttle remains one real model execution per interpretation. Folio is
now the second consumer and needs actual ordered step records and a separate
context identity. Existing Reading.units is a tuple of labels; current completion
stamps those labels with a version. It does not execute independent units.
Current identity checks source revision/digest; there is no separate context
snapshot/version in execute, approval, worker validation or apply.

The shared Sighting primitives in the extracted contract currently include the
source digest; the generic worker calls the surface's validate_findings callback.
The common source/span/reference/provenance checks still need a shared home as
Folio joins, while typed Shape/meaning checks stay in the surface. Folio must
reuse the lifecycle and shared runner, leaving unresolved Sightings for its own
Entity candidate resolver. The Writing shelf already contains flat Character,
Setting and Scene schemas. No schema copy exists in this change.

## OQ1 recommendation: a small, versioned step contract

Add an ordered sequence of Step definitions to Reading, preserving Shuttle's
one-model-step behavior and public wrapper contracts. A Step definition names:

- id and version;
- kind: deterministic or model;
- versioned input/output contract references;
- prerequisites and whether its output is required for a complete reading;
- execution/validation hooks. Model capability routing remains in Switchboard.

Record each attempt under the reading parent, using its existing ActionRun
payload/result records for the first slice. Do not introduce a second generic
run database before its need is demonstrated. Each Step record names its
attempt, definition version, source/context identity, state, timestamps,
input/output references or fingerprints, provenance, and structured error.
Only a model Step gets an execution child ActionRun; deterministic steps never
pose as calls. Keep prior step results/Sightings as superseded history. Pending,
running, succeeded, failed, skipped and not-attempted are **step/run states**,
not fields on a Sighting. A partial reading retains usable completed output and
identifies failed or unattempted prerequisites. It is not reported as success.

### First Folio reading: four actual steps

| Step | Execution | Output |
| --- | --- | --- |
| Source/context preparation | deterministic | Exact source, revisions, bounded approved context snapshot, digests |
| Cue recognition | deterministic baseline | Source-bound cues with negation/ambiguity, using Contour vocabulary |
| Semantic reading | one deliberate Claude execution | Proposed orientation/title and unresolved Character/Setting/Scene Sightings |
| Checked assembly | deterministic | Validated reading with real step records, provenance and questions |

For this initial slice, semantic reading handles orientation and Shape extraction
in one bounded call; the response says exactly that. They may become distinct
model steps as evaluation justifies it, via a versioned Strategy change. This
keeps the first return useful without fabricating several executions from one
prompt. Cue recognition is a separate deterministic unit we can measure today;
its candidates are not automatically promoted into Sightings.

After Heddle returns unresolved Sightings, **Folio** supplies Entity candidate
matching through the resolution seam and records its own response stage. No
Entity, Participation or Storyboard placement is created by recognition or
matching. Fiction Setting never becomes a real Place or map location.

### Context identity and consent

Bind the source revision/digest AND context revision/digest to every step,
request fingerprint, approval payload, dispatch payload, worker check and result
application. The context includes chosen/confirmed Fiction orientation, current
title, Contour bundle identity and relevant confirmed Entities/aliases. Define
stable bounded snapshot serialization so changed vocabulary cannot masquerade
as the same context version. A Folio-owned hook reads the current authoritative
context; Heddle compares identities without knowing Folio field names.

Before a cloud send, the person approves the displayed source/context and named
steps for this attempt. Each real cloud execution retains its bound approval
record through SW-9. Changing context invalidates old consent and late results;
no silent replay or backend switch. Keep the person's runtime separate from the
Folio sponsor, including future group-sponsored Folios.

Confirmation of a proposed new title changes context, so the earlier reading is
retained as superseded; applying it under the new context is forbidden. The UI
must show that transition rather than retroactively rewriting execution identity
or silently sending another cloud request. A confirmation that changes no
semantic context need not manufacture a new type/title revision; the confirmed
state and the exact context snapshot still need an explicit contract.

### Compatibility and acceptance

Shuttle keeps its existing one-call shape, task names, patch targets and response
contract. Its context can use an empty stable context identity internally while
new Folio responses expose the independent context axis. Keep all 89 Shuttle
tests green without weakening their expectations. Add Heddle tests for ordered
steps, skipped/unattempted prerequisites, partial failure, real child accounting,
source/context changes at every boundary, stale completion, and retained history.
New Folio model/endpoint proposals and migrations go to the CTO before coding
across their review boundary; FI-7 is not implemented by this decision brief.

## OQ2 recommendation: generate and check the first Folio bundle now

HD-5 will introduce Folio's first Strategy and generated contract copies after
Heddle extraction. Treat that as the D9 trigger rather than adding another
hand-maintained schema. Build a narrowly scoped generator/export with a drift
check alongside this slice, after Puddlejump accepts the Strategy draft.

Contour remains the source: Writing Shapes, vocabulary/disambiguation, guidance,
and the accepted Folio Strategy. Export a versioned dependency bundle with source
paths, versions and content digests. Derive the needed Core/client schema/types
from that bundle and fail checks when a regenerated result differs. Hashing only
a deployed copy does not establish that it matches Contour: source-side generation
and comparison must happen where the canonical Puddlejump checkout is available.

Recommend shipping the selected generated dependency bundle with the release;
record its source commit and digest. Production should not need an unpinned
checkout of all Puddlejump to interpret a Folio. This is a proposed deployment
choice: no Contour checkout, CONTOUR_ROOT change or production activation is
authorized by the existing handoff. Catalyst's runtime Contour dependencies are
separate and require their own complete manifest; a minimal Writing bundle is
not claimed to satisfy them.

No canonical Shape needs to change to begin: Character/Setting/Scene already use
the agreed flat envelope, including source_locator and uncertain, with no status
or payload wrapper. If the Strategy exposes a missing field, change Contour first
and regenerate; never patch a consumer copy first. Source/provenance/reference
validation remains runtime behavior in addition to JSON schema validation.

## FI-8 Strategy draft direction for Puddlejump

Propose a Fiction note reading Strategy on the Writing shelf using the four-step
sequence above. Its inputs are immutable FolioNote source and bounded versioned
context; outputs are a proposed reading/orientation, unresolved flat Writing
Sightings and materially useful questions. Reuse exact narrative passages,
keep uncertainty and negation, distinguish supplied facts from interpretation,
and preserve the three vocabularies: Shape cues (Setting includes locale/location),
confirmed Entity aliases and project markers. No learned vocabulary, invented
attributes, Entity creation, publication or real-world mapping.

Puddlejump owns the canonical id/version, Strategy files and manifest entry.
Submit the detailed Strategy draft through the agent inbox after these two CTO
forks settle; no downstream schema copy or capability registration precedes it.

## Recommended next order after CTO decisions

1. Puddlejump accepts the Strategy and records OQ1/OQ2 dispositions.
2. Extend generic Heddle steps/context identity, preserving Shuttle behavior;
   validate the generator/bundle/drift-check seam.
3. Propose Folio type/orientation/revision models and APIs for CTO review (FI-7).
4. Register Folio's Reading and its surface-only validation/resolution adapters;
   run synthetic permission, revision, span, partial-failure and matching tests.
5. Build the phone and Workbench first slice against the tested shared contract.
6. Deploy only on CTO go-ahead, after Heddle extraction and Contour availability
   are included. Live acceptance uses the CTO's real note only with permission.

The new Shuttle GET result lookup is built in core (1b193ce8) and still needs
its mobile read-only recovery connection; it is a separate client task and never
replays confirm. SH-10/map work remains unassigned in the handoff.

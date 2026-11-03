# FI-7 model and API proposal

2026-11-03 · Mobile Agent · For CTO review before implementation/migrations.

CTO refinement after discussion: be conservative with second readings; thoughtful
inputs and clarification help people become coherent. Confirmation/naming should
preserve useful work. For a material change, suggest a re-reading with a concrete
reason, then let the person discuss, clarify or approve it. Never automatically
call a model or require a second reading merely because the context changed.
Puddlejump must reconcile this refinement with the existing strict context rule
before implementation; the rest of this model/API proposal remains under review.

Step 3 of the approved November 2 HD-5 restart handoff. FI-8 is accepted;
core `b7c4d977` supplies ordered steps, source/context identity and the strict
Contour bundle. This document proposes Folio's adapter records and operations.
It adds no model, endpoint, capability, migration or deployment.

## Proposed first slice

One writer explicitly selects Fiction, captures an unchanged note, starts a
reading and approves the displayed cloud work. The reading proposes orientation,
title and several Character/Setting/Scene Sightings. The writer confirms context,
corrects the reading, dismisses findings, keeps selected findings for later or
explicitly links a supported finding to an Entity. All remaining findings can
simply fade from the active view; they do not become a task list.

Keep the existing Folio/BaseContent sponsorship and slugs. Preserve captured
notes, audio, verbatim passages, the independent note-level browse Shape and
existing Storyboard identity. Do not create a second interpretation pipeline,
provisional data table, Entity system or Storyboard grammar.

## What exists and must change deliberately

- Folio has a title and sponsor, but no type or orientation state.
- FolioNote holds original text/audio/transcript and legacy tending projections.
  The existing patch endpoint changes only the browse Shape or Folio association.
- Heddle stores sources, their revisions, attempts, step records and Sightings
  on the reading parent's ActionRun. Reuse it rather than duplicating findings.
- `storyboard.Entity` is sponsor-scoped, with name, kind, aliases and body.
  Confirmed legacy mention links already point to these Entities.
- The old Inception Analyze endpoint synchronously calls the local Hildegard
  gates, replaces proposed FolioMaterialCandidate rows and can derive a title.
  Its API, client helpers and Inception pages still exist. Retiring just the
  Django class would leave a live second writer and broken callers.
- `keep_sighting()` writes Shape-stamped ProvisionalData for an explicit keep.
  It validates the stamped schema but does not deduplicate clicks or authorize
  the source/sponsor for Folio. The surface must do those things transactionally.

## Proposed models

Names below are proposals. Use existing UUID/BaseModel conventions; no public
name or slug becomes globally unique. Row uniqueness reflects a relationship
or operation, not a platform-wide content name.

### Folio: add orientation fields

| Field | Proposed meaning |
| --- | --- |
| `work_type` | Blank or `fiction`; explicit writer choice. Unknown values rejected. No automatic backfill. |
| `context_revision` | Monotonic integer, initially 0; advances when the semantic snapshot changes. |
| `prepared_context` | Bounded JSON snapshot last explicitly prepared for review, initially empty. Its digest is computed; prior copies remain on reading ActionRuns. |
| `orientation_confirmed_by`, `orientation_confirmed_at` | Nullable confirmation evidence. Confirmation accepts no Sighting. |
| `orientation_confirmed_digest` | Digest of the exact type/title the writer confirmed; context edits invalidate this attestation. |

Existing nonblank titles are treated conservatively as writer-owned. New title
proposals remain in their reading output until explicitly accepted. The existing
title PATCH must use the context-aware service and BaseContent.save(), preserving
the placeholder/title-slug transition and slug history. No separate slug logic.

No new vocabulary table: offer only types whose pinned Contour Strategy/bundle is
available. Only Fiction is offered now. Capture remains available while untyped.
Group sponsorship remains supported in the model; the current personal access
surface stays sponsor-scoped. Do not invent group permissions/UI in this slice.

### FolioInterpretation: link a note to its Heddle parent

| Field | Proposed meaning |
| --- | --- |
| `folio_note` | FK to original captured FolioNote. |
| `action_run` | One-to-one protected reference to the Heddle parent, not a model child. |
| `initiated_by` | Person whose runtime, consent and self-authority apply. |

Unique `(folio_note, initiated_by)` gives the first slice one correction/retry
chain per note/person. Request replay and actual attempts remain Heddle's concern.
The parent carries Folio/note references, the source chain and context snapshots.
No Folio copy of the Sighting list or second run-state column. A parent remains
pending while reusable; keep/dismiss does not falsely mark all note work finished.
Do not add deletion behavior that silently removes the audit chain.

**Source revisions:** the first reading snapshots the exact ready note text.
Heddle's append-only correction sources/revision are the interpretation authority;
corrections never overwrite FolioNote.raw_text or the original transcript. No new
FolioNoteSourceRevision table is needed for this slice. Protect ready capture
from transcript/task overwrites once a reading exists; a deliberate replacement
transcription must enter the same superseding source service. Moving a note
between Folios is a context/authority change and supersedes active interpretations.

### FolioSightingDecision: only a person's action, never a candidate copy

| Field | Proposed meaning |
| --- | --- |
| `interpretation` | FK to FolioInterpretation. |
| `attempt_id`, `sighting_id` | Address the exact retained reading occurrence. A Sighting id alone is insufficient across retries. |
| `disposition` | `dismiss`, `defer`, or `link_entity` for the initial operations. No `proposed` rows. |
| `actor`, `decided_at` | Person and time of explicit decision. |
| `request_id`, `request_digest` | Idempotency binding to the exact command and target; scoped to actor/interpretation. |
| `provisional_data` | Nullable protected FK, set only by `defer`. |
| `entity` | Nullable protected FK, set only by explicit `link_entity`. |

Use a unique decision occurrence `(interpretation, attempt_id, sighting_id)` for
this slice, plus scoped request uniqueness. Identical retries return the recorded
decision; same key with another payload conflicts. No silent disposition overwrite
or undo API in this slice; a deliberate later transition needs a separately
reviewed operation, especially after provisional promotion. Database checks tie
each disposition to its allowed target fields.

The row references original findings; it does not restate their Shape payload or
introduce status into a Sighting. Confidence remains independent of disposition.
Creation locks the parent/current occurrence and validates ownership, identity,
current checked output and sponsor before changing anything.

For `defer`, create this decision and call `keep_sighting()` in the same atomic
transaction. Pass the current exact finding, its reading parent and Folio's
explicit member/group sponsor. A repeat cannot create two ProvisionalData rows.
The decision retains Folio association; ProvisionalData retains Shape/provenance.

For Character/Setting, `link_entity` links an existing same-sponsor Entity or,
only when explicitly requested, creates that Entity through the existing identity
service pattern. No implicit merge or alias learning. An alias change must be an
explicit writer choice. These decisions contribute confirmed Entities to later
Folio context alongside confirmed legacy mention links.

**Scene:** allow review, dismissal and keeping. Do not pretend a narrative Scene
is a Character/Setting Entity or automatically place it into Storyboard's tree.
Explicit Storyboard placement remains its own operation and later adapter. This
does not block the first multi-Sighting reading.

## Context snapshot and consistency

The authoritative snapshot contains Folio id, chosen type/current title, selected
Strategy/bundle identity and bounded confirmed Entity data/aliases from this Folio
(legacy confirmed mentions plus explicit new links). Use the same deterministic
projection across its notes; never pull the member's entire Entity universe.
For the initial slice, exceeding the explicit Entity/vocabulary budget is a
visible limit rather than silent truncation. Finer note-specific retrieval can
be a separately versioned selection policy later.
Shape cues, Entity aliases, project markers and field labels stay distinct.
Fiction has no real Place/Location/map bridge.

Use a Folio-owned service under a Folio row lock to prepare context on an explicit
command. Compare a stable serialization with the last stored semantic snapshot:
if changed, advance context_revision and update `prepared_context`; otherwise
reuse it. Semantic title/type edits use the same locked service. Keep each reading's
complete bounded snapshot in its ActionRun state/history. No extra context table
or model-written revision counter. Context preparation and execution are separate
so the writer can see exactly what the later Interpret action approves.

Entity names/aliases can change through existing Storyboard services. Therefore
the provider must recompute the authorized selected Entity projection at worker
and apply boundaries, rather than trusting only the Folio counter. A changed
digest blocks application even before the next explicit context preparation
advances the counter. Read-only GETs never increment revisions. Selecting current
context from old decision records must ignore deleted/inaccessible Entities.

**CTO-decided interaction rule:** confirming unchanged type/title records agreement
and lets review continue without a second model call. Naming or relabelling alone
should preserve useful findings; a title change is not automatically a reason to
read again. A change that could materially affect interpretation prompts a
concrete suggestion: for example, “Changing this from fiction to memoir may
affect how I understood Mara. Shall we revisit those findings?” The person can
discuss it, supply a thoughtful clarification or explicitly approve re-reading.
Neither a context edit nor a suggestion triggers an automatic cloud request.

Keep every original reading's execution identity/context and evidence intact.
Do not silently relabel findings as model-checked under a new context. Distinguish
execution staleness (late old work cannot replace newer work) from the person's
ability to review and consciously retain useful earlier findings. A person can
decline re-reading without being forced to abandon their captured work.

**Reconciliation required:** ADR-0060 D3/D4 and the accepted FI-8 draft currently
use a blanket stale-context rule. Puddlejump should record the interaction
refinement and settle how explicit human reaffirmation under changed context is
represented before coding it. Proposed direction: a surface decision references
the original attempt/context plus the context the person reviewed and their
clarification/reaffirmation; it never rewrites model provenance or impersonates a
new model execution. Do not infer materiality with an unapproved extra AI call.
Exact classification rules and the reaffirmation API remain review items.

## Proposed API operations

Paths below are relative to existing `/api/folio/`; internal API ids stay UUIDs.
Workbench page URLs keep their existing sponsor-scoped slug resolution.
No trailing slashes, matching current Folio conventions.

| Operation | Proposed endpoint and behavior |
| --- | --- |
| Create | Existing `POST folios`: optional explicit `work_type`; omitted stays untyped. Preserve title-only callers. |
| Context | `GET folios/{id}/interpretation-context`: current values, confirmation evidence, version/digest and available Strategy; no writes or model call. |
| Prepare context | `POST folios/{id}/interpretation-context`: expected revision + request id; materialize bounded current snapshot/revision for review, no cloud dispatch. |
| Choose/correct type/title | Extend existing Folio PATCH with expected context revision for semantic edits; update via locked context service. Existing title-only callers remain allowed but still invalidate context atomically. |
| Confirm orientation | `POST folios/{id}/orientation/confirm`: expected identity, exact accepted type/title, optional originating reading/proposal reference and request id; no Sighting decision or dispatch. |
| Begin | `POST folios/{id}/notes/{note_id}/readings`: request id; create/reuse the note/person Heddle parent, snapshot original source/context; no model call. |
| Inspect | `GET folios/{id}/notes/{note_id}/readings/{reading_id}`: source/context identity, actual steps/history, orientation proposal, unresolved Sightings and surface decisions. |
| Interpret | `POST .../readings/{reading_id}/execute`: request id, expected source revision/digest, context revision/digest and explicit consent to displayed steps. |
| Correct | `POST .../readings/{reading_id}/corrections`: request id, expected identities and exact correction text; append source and supersede, no implicit execution. |
| Refresh | `POST .../readings/{reading_id}/context`: expected context revision; use the newly prepared authoritative snapshot, retain old attempts, no implicit execution. |
| Decide | `POST .../readings/{reading_id}/sightings/{sighting_id}/decisions`: attempt id, expected identities, request id and disposition/explicit target. |

Responses use a Folio `reading_id`/`action_run_id` adapter; do not expose Shuttle's
`weave_action_run_id` wording as the new public Folio API. Preserve Heddle's existing
legacy key internally until a separately compatible generic rename is warranted.
Errors are explicit: inaccessible record 404; stale identity/conflicting replay
409; cloud approval/policy errors 403; unknown type/invalid Shape/target 400/422;
budget overflow 413; unavailable runtime/backend a visible unavailable state.

Resolve the nested Folio/note/reading relation and initiator on every operation.
The initial implementation uses current personal sponsor scope, never `created_by`
or `author` as a substitute for ownership. An arbitrary ActionRun/Sighting/Entity
id is not authority. Matching runs after Heddle and returns candidate suggestions
with reasons; it creates no Entity, decision, Participation or placement.

The first Folio cloud capability is a later registration against this contract,
not authority to call the old direct gates or borrow a Group/server runtime.
Switchboard/SW-9 must accept the generic bound payload and gate it before the
existing Core worker. Automatic local tending stays paused for the live trial.

## Retire FolioMaterialCandidate without reinterpreting history

1. Before writing a migration, inspect counts/uses of FolioInception and candidate
   rows in each deployment through the CTO's read-only deployment check. Earlier
   “no Folios” reports are historical, not permission to assume empty tables now.
2. Stop new candidate production: retire the old Analyze POST's direct local calls
   and title derivation. Recommend explicit 410 with replacement reading guidance;
   never redirect a POST into a cloud operation or reinterpret it as consent.
3. Preserve FolioInception/raw text. Creation can remain as capture only. Existing
   inception pages/client helpers must stop invoking Analyze and offer navigation
   to Notes/new reading; no automatic Fiction selection or model call.
4. If there are no candidate rows, propose a straightforward removal migration
   after callers are updated. If there are rows, pause for a concrete preservation
   plan before removal: original source, spans, display amendments, relationships
   and human decisions must survive with their legacy provenance.
5. Do not map legacy subject/intention/material values to Fiction Shapes or turn
   `confirmed` into `defer`/Entity placement automatically. Those meanings differ,
   and legacy numeric confidence is not a new categorical Shape reading.
6. Recommend a read-only legacy audit representation if rows exist, scoped to the
   same sponsor, while the source is available for an explicitly approved fresh
   reading. Its exact storage/export and retention need review with real counts;
   no new production legacy archive table is proposed blindly.
7. Remove CandidateType/Status, serializers/views/URLs and obsolete gate imports
   only with the coordinated core/client retirement. Preserve old migration files
   as history; create a new reviewed migration after deployed 0005. Retire obsolete
   tests alongside callers, replacing them with capture, explicit-reading and
   preserved-history cases rather than merely deleting coverage.

This is the largest compatibility item in FI-7. It includes web Inception pages
and current shared Folio hooks outside `clients/folio/`. Identify/approve those
specific edits before implementing; do not silently modify shared barrels or
leave broken helpers when the database class is removed.

## Migration scope to show before deployment

After this model/API proposal is accepted: draft new Folio migrations adding the
orientation fields, FolioInterpretation and FolioSightingDecision constraints.
Backfill type as unknown, confirmation as absent, existing title as protected;
do not interpret notes, create ActionRuns or send network requests in migrations.
Candidate removal is separately conditioned on verified data/caller retirement.
Show the exact generated migration and preservation steps to the CTO before deploy.
This is a new migration after deployed 0005; no replacement of deployed history.

## Acceptance and implementation order

- Scope/permissions: cross-member references fail; group runtime is never borrowed;
  all explicit targets match the Folio sponsor. Unsupported types send nothing.
- Orientation: capture works untyped; title proposals do not write; confirmation
  accepts no Sightings. No automatic second reading or forced re-reading for a
  label change; a material change prompts a reasoned suggestion. A new execution
  requires explicit context-bound consent; earlier findings retain their provenance.
- Source: raw capture/audio remain intact; corrections are append-only; late old
  callbacks cannot overwrite current findings; note movement invalidates context.
- Decisions: duplicate keep creates one ProvisionalData row; conflicting replay or
  stale attempt fails; spoofed Sighting fields are ignored/rejected in favor of
  the server's checked finding; failed transaction leaves no orphan keep/decision.
- Meaning: Character/Setting links need explicit authorization; no learned alias
  from recognition; Scene stays verbatim and unplaced until explicit later action.
- Retirement: no legacy direct Analyze runs; raw inception and previous human work
  preserved; old callers give usable migration guidance; no auto-conversion/consent.

Implement models/atomic services and their permission/idempotency tests first;
then serializers/endpoints and legacy retirement; then the approved Folio Reading,
resolution adapter and capability registration; then FI-9 phone/Workbench against
the tested API. Keep Shuttle's suite green. No deployment or live acceptance is
included in this proposal's approval.

## CTO review requested

Approve or amend: (1) these three model changes and Heddle-owned source history;
(2) explicit defer/link/dismiss decisions, with Scene placement deferred;
(3) the recorded conservative re-reading decisions and Puddlejump's reconciliation
of provenance, human reaffirmation and the strict stale-context rule;
(4) legacy Analyze retirement and data-dependent candidate removal. Puddlejump
should reconcile the accepted rule against ADR-0060 and record the FI-7 review.
No backend or migration implementation has begun.

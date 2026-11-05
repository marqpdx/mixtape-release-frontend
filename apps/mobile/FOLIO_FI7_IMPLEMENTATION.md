# FI-7 implementation checkpoints

2026-11-04 · Mobile Agent · ADR-0060 / ADR-0061

FI-7 remains in progress. Core `bb5e16ae` added orientation fields,
FolioInterpretation, FolioSightingDecision and atomic context/decision services.
Migration 0006 is draft for deployment; it has run only in isolated test databases.

## Context API unit

The next core unit exposes these operations, all personally sponsor-scoped:

| Operation | Contract |
| --- | --- |
| POST `/api/folio/folios` | Optional `work_type`: blank or `fiction`; capture remains possible untyped. |
| PATCH `/api/folio/folios/{id}` | Title and/or type; type changes require `expected_revision`. Existing title-only callers remain supported. |
| GET `/api/folio/folios/{id}/interpretation-context` | Read-only live context and digest. No revision increment or model execution. |
| POST same context URL | UUID `request_id`, integer `expected_revision`; explicitly prepares context. |
| POST `/api/folio/folios/{id}/orientation/confirm` | UUID `request_id`, exact `expected_digest`, `title`, `work_type=fiction`. Accepts no Sightings. |

Context responses contain `context` and `context_digest`. Preparation and
confirmation replay the original operation result for the same request and
payload; reusing that key with another payload conflicts. A replay is a receipt
of the original operation, not an assertion that the returned context is still
current: inspect context again after edits. Replaying confirmation never restores
an attestation invalidated by later edits.

Command receipts live separately from the semantic snapshot in prepared_context
and do not alter its digest. The initial bound is 100 recorded commands per Folio;
overflow is explicit (413), with no silent receipt eviction. This is an initial
bound to revisit before wider use, not a permanent Folio lifetime policy.

Type changes return a deterministic re-reading suggestion; title edits return
none. Neither starts a reading. Exact title/type confirmation accepts no finding,
and title proposals remain unwritten until an explicit edit. BaseContent continues
to own slug behavior. No new migration is added by this API unit.

## Trial cases

Folio's first intended end-to-end case is Fiction / Jackalope:

> this is for a fiction story, title Jackalope, locale is desert southwest, main character is Travis and second charater is Lucy, and the first scene takes place in a bar

The API tests retain this exact capture through orientation confirmation. They do
not claim that recognition or semantic interpretation has run. The future reading
should recognize locale as a Setting cue, Travis and Lucy as Character proposals,
and the limited scene-in-a-bar statement without inventing narrative.

Shuttle's approved ST-3 phone trial remains separate and can run first. Its
three-choir telling should preserve the uncertain Australian name, personal
attendance and intended collective-singing connection. A cloud reading, whole-weave
publication and map acceptance are separate checkpoints. Confirm the installed
build and production target before the trial; the CTO runs server log commands.

## Still to build

- Public reading lifecycle and decision endpoints, resolution seam and capability routing.
- Coordinated legacy Analyze/client retirement, with candidate removal gated on
  the CTO's production row count and preservation decision if rows exist.
- Client Fiction chooser, orientation confirmation and multi-Sighting reading.
  Assess the installed build and rebuild requirements before the end-to-end trial.

No live trial, deployment, runtime login or NER M2 run is included in these units.

## Verification scope

The context API initially passed the Folio/Heddle/Shuttle run (202 tests, four
skipped). Two further safeguards reject extra Sighting fields on confirmation
and ensure replay cannot reconfirm an edited title. During their verification,
concurrent Atrium renaming left the project's root URL imports inconsistent.
The final check uses temporary `fi7_urls` with the actual Folio and Shuttle URL
modules, leaving the unrelated edits untouched. A passing isolated check does
not establish that the full project's URL configuration is healthy.
Final isolated result: 204 tests, OK, four skipped; whitespace checks pass.

## Fiction Strategy and source adapter unit

Core now implements the four Contour-defined steps: source/context preparation,
deterministic cue recognition, one semantic reading, and deterministic checked
assembly. The complete Writing shelf is read from Heddle's verified release
bundle, including the canonical Strategy and Shape companions. Schemas are
looked up there; no consumer schema was edited independently.

The response contract contains orientation, Sightings and up to three material
questions. Checked assembly preserves writer-set titles and verbatim Scene
passages; source spans, supported Shape versions, unique IDs and typed references
are checked by Heddle plus Folio's validator. Cue recognition records negation and
ordinary-use ambiguity without treating those rules as semantic interpretation.

Initial limits: 40,000 source characters (including appended corrections),
80,000 characters for the complete Writing bundle, 150,000 prompt characters,
100,000 output characters and 60 Sightings. Exceeding a limit fails visibly;
the bundle is never silently truncated. These are implementation budgets, not
measured model capacity or accuracy claims.

Context now includes Strategy, bundle and selected-file identities, writer-set
title evidence and separate empty project-marker/field-label vocabularies. No
markers or aliases are learned from a reading.

Folio's begin/inspect service adapter accepts an injected Heddle Reading, creates
or reuses one parent per note/person, and returns `reading_id`/`action_run_id`
instead of public Shuttle wording. It snapshots exact ready capture without
dispatch. Capture saves and transcription cannot overwrite source already read;
corrections use Heddle's append-only history. A moved note invalidates the old
parent's authoritative context. QuerySet.update bypasses model save guards and
must not be used to replace captured source.

The Reading factory is deliberately unregistered. This unit chooses no production
capability name and adds no cloud worker, callback or public reading endpoint.
Lifecycle/dispatch wiring, API exposure, resolution and live acceptance remain
subsequent work. It does not yet make Folio's phone reading ready.

Verification: 231 tests, OK, four skipped, using the same isolated Folio/Shuttle
URL configuration noted above. The new unit adds 18 Strategy tests and nine
source-adapter tests; no actual model was invoked for these cases.

## November 5 handoff: contracts and ownership

Picked up `zz/handoff-2026-11-05-mobile-folio-contract-decided-next.md`, approved
by the CTO. Blue owns the local execution seam, command receipts, decision fields,
migration and shared API schema; BA2 owns host fit; Puddlejump places Contour files.
Mobile's next delivery is drafting, not schema/API implementation or a phone build.

Drafts under `contour-proposals/folio-recognition-2026-11-05/` include shared
provenance/Dictionary definitions, Character/Setting 0.2.0 and the separate
`writing.fiction_note_recognition` 0.1.0 Strategy. Same-Entity Dictionary merges
only; public status is partial/recognition_only/semantic not_run, with actual step
states preserved. Matching proposes NFC(casefold(NFC(value))) with original
spelling/offsets preserved. These are intake drafts; canonical files, runtime
schemas and consumer bundles remain unchanged until review and placement.

Verification: 52 proposed-schema cases plus original-schema hash and Unicode rule
checks pass offline. Runtime $ref resolution and actual enforcement of format
checks remain Blue/Puddlejump integration work. NER M3 cases and the proposed
small local generative comparator are the next Mobile/NER Eval drafting units;
new model choice still gets the CTO's go-ahead before download/run.

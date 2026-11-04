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

- Note-source preservation and movement integration; full pinned Strategy/bundle
  identity in context and the Folio Reading adapter.
- Reading lifecycle and decision endpoints, resolution seam and capability routing.
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

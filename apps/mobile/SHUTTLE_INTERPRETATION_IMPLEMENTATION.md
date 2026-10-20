# Shuttle interpretation implementation checkpoint

**Current reconciliation:** [integration plan and Mobile/Blue ownership](SHUTTLE_RECONCILIATION.md).
Blue has since built deterministic placement and the real packet/confirm APIs;
Mobile still needs to connect publication review. The CTO reports repos pushed
and servers restarted. Personal runtime provisioning remains blocked, and live
acceptance has not run. Distinguish this current state from the original commit
checkpoint below.

2026-10-20. Governed by ADR-0058 v0.1.3 and the approved
[findings contract](SHUTTLE_FINDINGS_CONTRACT_DRAFT.md). The approved plan and
contract were committed in `299b2e03`. This coordinated implementation is recorded
in the [commit handoff](SHUTTLE_COMMIT_HANDOFF_2026-10-20.md), included with the
Frontend implementation commit. Nothing has been deployed, interpreted with a
live model, built into a new APK, or published by this work.

## Implemented path

The phone reuses Notebook's CaptureDock, voice Seed upload, and transcription.
**Read my weave** starts the envelope through Core's shared `start_weave` service.
**Review with Claude** requests explicit consent for the original telling and
correction sources. Core records source-bound approval on the child execution
ActionRun before dispatch. Switchboard applies SW-9 and either dispatches local
Inkwell work or hands permitted cloud work to a Core worker.

The worker resolves the authenticated person's READY runtime, requires
`shuttle_weave_interpret` in its allowed modes, and uses the existing shared
Claude runner under that runtime's Linux user and home. Missing accounts have no
fallback. Model tools, MCP servers, slash commands, and hooks are disabled for
this bounded interpretation. The envelope retains the platform tenant; person
identity governs runtime resolution separately.

Core validates six Sighting Shapes, exact Unicode source spans, references,
verbatim stories, and bounded questions. Only the child execution completes;
the envelope remains pending for later packet work. Corrections append immutable
sources and increment the revision. Stale completions cannot replace a newer
reading. The phone shows the reading, connections and their evidence, stories,
uncertainties, questions, and a correction capture dock. Copy for interpretation
remains available as a manual fallback.

## Code surfaces

- Core: `shuttle/interpretation/` contract, lifecycle, API, tasks, fixtures and
  tests; Shuttle URL registration and task discovery; bounded options added to
  the existing `claude.service.run_blocking` runner.
- Switchboard: `shuttle_weave_interpret` payload/response registration and a
  backend seam in the existing asynchronous capability path, behind SW-9.
- Inkwell: a local handler using the existing loaded model and JSON grammar.
  Inkwell keeps no records and makes no routing decisions.
- Shared API: `clients/shuttle/findings.ts`, schema, and actual spoken-choirs
  fixture. Schema and fixture match Core byte for byte. SH-7a is unchanged.
- Mobile: `ShuttleInterpretationPanel.tsx` and its use in `ShuttleScreen.tsx`.

Authenticated Core routes:

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/shuttle/weaves/` | Start from an owned, ready Seed |
| GET | `/api/shuttle/weaves/<id>/` | Read current sources and findings |
| POST | `/api/shuttle/weaves/<id>/interpret/` | Approve and execute a revision |
| POST | `/api/shuttle/weaves/<id>/correct/` | Append a typed or transcribed correction |

Core's `SHUTTLE_INTERPRET_CLOUD` setting defaults to true; false requests local
execution through Switchboard. No deployed configuration was changed. The phone
cannot select a runtime or bypass policy.

The [Contour bundle](contour/shuttle/README.md) is the original relay artifact.
Puddlejump took in the six Shapes and Strategy in `4eff4d5`, moved the Strategy
to `reference/contour/shuttle/strategies/weave-to-packet.*`, and added its manifest
entry. Canonical entries remain draft until live acceptance; use the canonical
layout for future library changes. Keep Core/API/Contour schema copies in step.

## Verification and remaining gates

Passed: 33 targeted Core tests using a dedicated local test database, 23
Switchboard tests, two Inkwell tests, mobile TypeScript checking, and the existing
Shuttle review checks. Model execution is mocked; these checks do not establish
live model quality or deployment readiness.

At commit review, all 27 staged backend/shared API implementation files matched
the verified checkpoint. Core and shared API schema/fixture parity and all four
repositories' whitespace checks passed. The latest mobile TypeScript check also
passed after the polling-error display was added. No model was called for these
checks.

Before the first live replay:

1. Carry the Contour bundle through the CTO's Puddlejump process.
2. Review and deploy the coordinated Core, Switchboard, and Inkwell changes;
   restart workers so the new tasks are registered.
3. Verify the person's runtime is READY, permits `shuttle_weave_interpret`, and
   has the intended Linux user, home, and supported Claude CLI flags. Verify the
   account has `initiatives.approve_cloud_dispatch`.
4. Verify active SW-9 policy and persisted approval recording before cloud
   dispatch. Local tests cover that ordering; deployment remains unverified.
5. Build/install the phone app with the existing release script and replay the
   real telling, a correction, and the contrast cases in the approved plan.

Interpretation initially reports **unresolved**, with no invented candidates.
Blue's later placement resolves Sightings and holds a packet when explicitly
requested. Real mobile packet review/publication and map verification remain
integration work, assigned in the reconciliation plan. Do not use Inkwell's
direct Qdrant read.
Local rollout, transcription privacy pinning, policy-source joins, and Codex are
also later work. This checkpoint does not mark all of SH-11 complete.

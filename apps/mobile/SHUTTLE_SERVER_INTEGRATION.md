# Shuttle interpretation — integration findings and proposed next slice

2026-10-19. Read-only inspection of local Core, Frontend, Switchboard, Inkwell,
and Puddlejump checkouts. This does not verify the deployed server, its active
runtime accounts, queue health, or model availability. No backend code changed.

**Review correction, 2026-10-19:** Puddlejump returned compatible-with-amendments.
The earlier investigation missed the existing Switchboard → Core Claude path
for LinkedIn copy, `ActionRun.parent_action`, the no-fallback behavior in
`CodexExecAdapter`, and the applicability of Contour Sightings. Those corrections
are incorporated below. The [build sub-plan](SHUTTLE_BUILD_PLAN.md) records all
five CTO decisions as pending; this review is not integration authorization.

## Architectural direction

Shuttle requests bounded interpretation capabilities. Switchboard chooses
execution according to capability and effective privacy policy; Inkwell is the
existing local cognition service. Core owns authenticated identity, permission,
source records, domain matching, and publication. Stackroom owns semantic
retrieval. The phone presents findings and corrections.

This follows the larger narrative, rather than introducing a separate Shuttle
model-routing architecture:

- `puddlejump/decisions/coherence-notes/oca-capability-routing-governed-verbs-keepers.md`
  is a draft coherence note distinguishing capability routing, intent
  interpretation, and governed actions. It explicitly identifies direct cloud
  subprocess calls that bypass capability routing as a pattern to retire.
- `puddlejump/decisions/positions/position-paper-the-field.md`, “Resourceful
  computation,” assigns deterministic resolution to specific machinery, bounded
  classification to local/small models where sufficient, and routing to
  Switchboard. This is a position, not evidence that all routing is implemented.
- `puddlejump/decisions/switchboard-mcp-adr/design-note-prep-work.md` describes
  Scaffold: deterministic preparation before model interpretation. It does not
  claim that mechanical parsing can infer intended relationships.
- `puddlejump/decisions/switchboard-mcp-adr/switchboard-status.md`, Session 021,
  records the generic async capability path used by Folio. Source inspection
  confirms the task exists; deployment acceptance is separate.
- The per-tenant runtime ADR governs client-owned credentials and Unix-account
  isolation. Account isolation and local-model privacy are separate properties.

## Existing web → Claude path

The current Atrium path is:

`AtriumDialogSurface` → `useAtriumExchange` → authenticated
`POST /api/atrium/sessions/<id>/exchange` → `AtriumAIService` →
`ClaudeCodeAdapter` → shared `claude.service.send_to_session` subprocess → SSE
response and persisted conversation entries.

Source anchors:

- Frontend `apps/mixtape/src/components/atrium/AtriumDialogSurface.tsx`
- Frontend `packages/api/src/hooks/atrium/useAtrium.ts`
- Core `app/atrium/api/views.py: AtriumSessionExchangeView`
- Core `app/atrium/ai/service.py: ClaudeCodeAdapter`
- Core `app/claude/service.py`

The authenticated view checks session ownership, but the Claude adapter's
`warm` and `exchange_stream` calls do **not** pass `run_as_user` to the shared
runner. Its configured working directory is not a per-person runtime resolver.
Reusing that adapter unchanged would not meet Shuttle's person/account rule.
Its in-memory persistent session registry also has a documented multi-worker
limitation. Reuse the transport patterns where useful, not its implicit runtime.

`TenantClaudeRuntime` already stores Linux-user/home metadata and readiness.
The present management API is admin-only and Group-scoped:
`/api/tenant-runtime/groups/<slug>/{status,start-login,login-status}/`.
The runtime status document confirms that no frontend currently drives that
login flow. Runtime onboarding UI is thus unfinished, although an already
configured account may be enough for the first CTO test.

Catalyst's `_runtime_preflight` is useful precedent but returns a legacy
server-account fallback when no runtime exists. Do not copy that fallback.
The person's authorized runtime must be explicit and missing setup must remain
a visible state. Inspect actual account mapping before attempting a live run.

## Existing capability path to reuse

The nearest **cloud** precedent already exists:
Switchboard `app/tasks/synopsis_linkedin.py` dispatches
`writing.tasks.generate_linkedin_copy_with_claude_code` to Core's `catalyst`
queue. Core checks the ActionRun tenant/principal and `cloud_approved`, resolves
a READY Group `TenantClaudeRuntime`, checks allowed modes, and invokes the
shared runner under that runtime's Linux user. Its missing-runtime fallback
uses the server's Claude login; remove that behavior in the shared Shuttle path.
Atrium's `CodexExecAdapter` is the existing no-fallback precedent: missing or
not-ready runtime returns an explicit error.

Core `app/folio/tasks.py` demonstrates:

`Core task` → recorded `ActionRun` → `switchboard.capability_async` → typed
capability payload validation → Inkwell → finalized result → callback carrying
the ActionRun id back to Core.

Switchboard source:

- `app/tasks/capability.py`: generic async execution and callbacks.
- `app/core/inkwell_models.py`: payload/response registry; currently includes
  document summary, initiative ideastream, derive, and Folio note tending.
- `app/services/cognition.py`: capability call to the Inkwell client.

The generic capability path is currently Inkwell-backed. Extend its backend seam
using the existing LinkedIn-style Core runner for cloud work, subject to CTO
decision 3. Do not build a third Claude path. The process receives only approved
task input; interpreter authority must not include publication writes.

The Core `inkwell/dispatch_policy.py` evaluator exists, but no callers were found
in the inspected Core Python code. Switchboard has a separate escalation gate
used by draft/refine. Its statement that no cloud backend exists is outdated:
the LinkedIn path exists. SW-9's upstream Core approval recording remains a
required gate before this trial. Verify enforcement at actual dispatch, not
from comments. Full policy-source unification is later work; effective
restrictions and approval still apply to this first test.

## Discrete work units

Names below are proposed task boundaries, not new registered capability slugs or
an approved intermediate API. Each unit needs typed inputs/outputs, a version,
source references, validation, and its own evaluation examples. They are
separable responsibilities; they need not each require a separate model call.
Puddlejump recommends representing findings as **Contour Sightings** under
Shuttle's Shapes, produced by a versioned Strategy, with `shape_id`,
`shape_version`, confidence, source location, and uncertainty preservation.
This is pending CTO decision 4 and OQ4 (where the Shapes live). Unconfirmed
Sightings evaporate; Core's original source remains the voice Seed. Do not
invent a separate findings ontology or make Inkwell keep source records.

| Unit | Input → output | Suitable machinery |
|---|---|---|
| Source preparation | Original transcript → stable source id/hash, spans, turn boundaries, explicit links | Deterministic code; preserve original text |
| Mention extraction | Source → possible things, named Places/locales, Ideas, uncertainty, source spans | Bounded local model/classifier where sufficient |
| Story attribution | Source + mentions → verbatim passages, subject, direct experience/hearsay/recollection/unknown | Model proposes attribution; code checks quoted spans |
| Entity/Idea resolution | Mentions → authorized existing candidates and scores | Core SH-1 matching; Stackroom retrieval only for semantic Idea candidates; no direct Inkwell Qdrant read |
| Connection interpretation | Source evidence + relevant mentions/Ideas → proposed cluster/edges, reasons, evidence of intent, uncertainty | Local model when adequate; Claude for the first permitted test |
| Clarification and correction | Findings + person's response → minimal useful questions or revised findings | Bounded interpretation; preserve earlier source and correction provenance |
| Packet assembly | Accepted findings + resolved candidates → SH-7a packet | Core governed envelope, validated deterministically |
| Confirmed publication | Packet + explicit confirm deltas → rows/Seeds | Authorized Core transaction; no LLM authority to publish |

Source-span checks guarantee text fidelity, not correctness of attribution.
Entities suggested by speech recognition remain candidates until resolved.
Connection interpretation must retain enough original context to hear “all
three” and “singing together is the key thing”; careless fragmentation loses
the very intent we are testing. Carry referenced context between units.

Allow local models to handle some or all interpretive units where their measured
fidelity is sufficient. Request a capability, not a hardcoded model. Do not route
every uncertain result to cloud automatically. Privacy restrictions can exclude
cloud entirely; lack of adequate local execution should produce an explicit
unavailable/uncertain result or a useful question, not unauthorized escalation.

Resourcefulness also means avoiding excessive calls: for this short telling,
one Claude request may return several separately validated outputs in the pilot.
Logical separation must exist from the outset; process-level separation can
follow measured benefit. Corrections should rerun affected units and dependent
results rather than blindly repeat unrelated work. A corrected entity name may
require refreshing resolution and its connection labels without changing the
original story text.

## Privacy applies to every stage

A Claude Code process running under the person's Linux account still uses a
remote model. It provides account/credential isolation, not local inference.
Evaluate effective privacy policy before sending each task and its context.
Send the minimum sufficient input; scope retained context and results to the
same authenticated principal/tenant. Publication intent does not waive privacy.

Audit transcription and embedding/retrieval as well as interpretation. The
existing voice-Seed task calls `concord.services.whisper.transcribe_audio`;
its backend selector supports local execution and a remote API, with automatic
selection based on availability/configuration. That is source evidence, not a
claim that the current installation sends audio remotely. A local-only client
needs explicit end-to-end policy enforcement, not just a local parsing model.

## Proposed first integration slice

1. Confirm the CTO's authorized runtime/account mapping and readiness through
   existing server administration. No phone-supplied Linux user/path and no
   fallback to server credentials.
2. Agree the intermediate findings schema and correction request shape with the
   CTO. Preserve SH-7a unchanged; do not treat free-form model output as a packet.
3. Implement one shared interpretation capability through the existing task
   boundary, with the work units above represented in its typed results. Select
   Claude only when policy permits; keep an Inkwell adapter seam for local work.
4. Expose an authenticated Core interpretation operation and a correction
   operation/status path. Return validated findings to the same weave. Async
   ActionRun polling is existing precedent; streaming is optional for the first
   mobile test. Specify how interpretation runs relate to the envelope's one
   ActionRun per weave before adding child/job records; do not change that rule
   accidentally by reusing an existing per-call recording pattern.
5. Add shared API client/types for web and mobile. Shuttle displays “what I
   heard,” accepts a correction, and returns a revised reading. The initial
   test stops there; packet approval and publication remain later integration.
6. Replay the actual three-choirs telling; assess connection intent/evidence,
   exact story text, uncertain names/city, account isolation, forbidden-cloud
   behavior, auth failure, timeout, invalid output, and stale correction results.
   Then compare local execution on the same units with the same acceptance set.

This needs coordinated Core/Switchboard/Inkwell/API work, not a mobile-only
patch. Current work is an implementation proposal for the CTO/main agent, not
a deployment or a claim that the server capability is connected.

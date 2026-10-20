# Shuttle mobile working plan — SH-11

Updated: 2026-10-19. Governing decision: ADR-0058, especially the First Use Case
and D1–D3. The packet contract remains the SH-7a contract in
`packages/api/src/clients/shuttle/contract.ts`.

## Capture has an intended audience

The CTO refined the mobile direction during the first Note 20 pilot:

- **Notebook:** private capture, with no expectation of publication.
- **Shuttle:** capture with intent to publish to the wider Commons soon. The
  capture area sits near the top so that intent is apparent on arrival.
- **Storyline:** a possible middle position for sharing with friends. This is a
  future design direction, not an implemented audience or privacy guarantee.

Shuttle and Notebook use one `CaptureDock` component and the same
`useNativeVoiceRecorder`, voice-Seed upload API/hooks, and
`useSeedTranscription` socket notification/polling fallback. Do not build a second
recorder or transcription path for Shuttle. Shared mechanics do not make the
two capture modes equivalent in purpose.

Today, a Shuttle capture is stored as a private Seed through the existing
Notebook service. Capture never grants publication permission. The app states
this interim behavior explicitly. No audience settings or backend contracts
are changed by this pilot.

## Next checkpoint: capture and interpretation trial

Before concentrating on packet approval, the CTO records a natural telling:
finding Pub Choir, remembering Choir! Choir! Choir!, and recalling Low Bar
Chorale in Portland. Hesitations, incomplete names, corrections, and uncertainty
are useful input. Do not require a polished version of the fixture's wording.

1. Open the far-right Shuttle tab; the shared capture dock is near the top.
2. Record and send a weave. The existing voice-Seed service retains the audio
   and transcribes it. Typed capture remains available through the same dock.
3. Show the ready transcript verbatim. Processing, failure, and missing-text
   states must not present placeholder text as a completed transcript.
4. Choose **Copy for interpretation** and paste into the working conversation.
   This copies the original text and a request to interpret it; it does not
   automatically send a message or call a parser.
5. The agent reports things, named Places/locales, proposed Ideas, connections
   and reasons, story passages, and uncertainties. Separate direct experience,
   hearsay, recollection, and inference. Never invent matches or addresses,
   rewrite the person's stories, or imply that map placement has happened.
6. Discuss the reading with the CTO and tune the interpretation and mobile
   experience. Questions should be few and materially useful.

**Done when:** a real spoken weave has been transcribed, interpreted together,
and assessed by the CTO for meaning and UX. The first real telling has now
completed this loop on the Note 20 (2026-10-19); its central prompt finding is
recorded below. This is one successful pilot example, not completion of SH-11
or evidence that interpretation works reliably across other tellings.

## First trial finding: intended connection and inferred meaning

The CTO's actual telling linked three singing groups and supplied one firsthand
story. Its connective evidence included “So all three of those” and “singing
together is the key thing.” The agent inferred a cluster through participatory
singing. The CTO identified this inference as the lynchpin: the person intends
the connection coherently enough for the agent to infer it accurately, without
turning capture into a formal specification.

The next findings response should lead with a short proposed reading, e.g.:

> I hear these three groups as connected through singing together. You brought
> them together with “So all three of those” and named “singing together” as
> the key thing. Is that the connection you meant?

That question illustrates the correction opportunity; do not add a mandatory
extra confirmation round when the existing packet approval can carry it. One
coherent cluster-level statement can support several proposed adjacencies.
Do not demand a separate statement of intent for every pair. Still show each
proposed adjacency's reason before publication, as ADR-0058 requires.

Prompt rules for the next tests:

- Distinguish expressed intent, the agent's interpretation, and uncertainty.
  Quote the telling as evidence for a connection. Similar subject matter alone
  is insufficient evidence that the person intended an adjacency.
- Preserve first-person story passages verbatim. Do not infer attendance at
  other places from attendance at one, or turn a recollection into experience.
- Keep uncertain names/locations explicit. This telling said Australia, not
  Brisbane; prior fixture knowledge cannot silently supply a city or a match.
- Return findings before asking the person to operate the full packet UI.
  Correct the reading with a small, useful exchange. Avoid questions that
  merely demand polished speech or block on nonessential completeness.
- Use one interpretation request per telling for the first tests. No automatic
  discovery loop or repeated attempts to fill missing details. Repeat only for
  a meaningful correction or a surfaced failure.

The prompt is promising on this example. Test another less explicit connection,
a correction, and an unrelated item before treating it as reliable.

## Sub-plan for Puddlejump review: interpretation and correction through shared capabilities

**Status: CTO decisions 1–5 returned and approved as recommended, 2026-10-19.**
Recorded in Shuttle ADR v0.1.3 (Headnote of 2026-10-19) and its status document.
The CTO has also approved the [findings contract](SHUTTLE_FINDINGS_CONTRACT_DRAFT.md)
in this session (recorded 2026-10-20). Implementation may proceed within those
decisions and that contract. Runtime/mode readiness and recorded cloud approval
remain gates before the first live run.
Supporting source reconnaissance: [server integration findings](SHUTTLE_SERVER_INTEGRATION.md).
No server connection or deployment has yet been performed in this mobile
session. The decisions authorize the amended implementation sequence, not
registration of an unapproved contract or an ungated live run.

### Motivation and outcome

Reuse the platform's existing capabilities and planned shared services. Shuttle
should help prove the larger architecture, not create its own recorder, model
router, subprocess runner, job framework, or publication system.

The governing motivation is:

> The larger narrative supports discrete cognitive tasks, routed by capability
> and privacy policy.

Application callers request a bounded capability rather than a particular
model. Deterministic machinery does the work it can perform reliably; local
LLMs handle some or all interpretation where their fidelity is sufficient;
cloud reasoning is available only where policy permits. This is essential for
privacy-facing clients, not an optional optimization to add after a monolithic
cloud parser has shipped.

**Observable next success:** on the Note 20, the CTO records a natural weave,
receives a concise reading inside Shuttle, corrects it, and receives a revised
reading of the same weave. The reading identifies things, Places/locales,
Ideas, stories, intended connections, and uncertainties. Its connection reasons
are grounded in the telling. This slice ends before publication and replaces
the manual clipboard handoff for interpretation.

### Discrete units: agreed base for verification

| Unit | Responsibility and output | Reuse / candidate execution |
|---|---|---|
| Source preparation | Preserve original transcript; establish stable source reference/hash, spans, and turns | Existing capture/transcription; deterministic preparation, aligned with Scaffold |
| Mention extraction | Candidate things, named Places/locales, Ideas, and uncertainties with source references | Bounded capability; local classifier/model where sufficient |
| Story attribution | Verbatim passages linked to subjects; distinguish experience, hearsay, recollection, and unknown | Model proposes attribution; code validates quoted spans |
| Entity/Idea resolution | Authorized existing candidates, match evidence, and unresolved mentions | Core SH-1 matching; Stackroom semantic retrieval where needed |
| Connection interpretation | Proposed cluster/adjacencies, reasons, evidence of the person's intent, and uncertainty | Local model where adequate; Claude for the first policy-permitted server trial |
| Clarification and correction | Minimal useful question or revised findings, tied to the same weave and source revision | Bounded interpretation; preserve correction provenance |
| Packet assembly | Accepted findings and resolved candidates become the SH-7a packet | Core governed envelope; later integration with SH-7b/SH-8 |
| Confirmed publication | Explicit approval writes the packet in one authorized transaction | Existing/planned Core domain services; outside this slice |

These are logical work units, not a requirement for eight separate calls or new
services. One short pilot request can return several separately validated
outputs. Preserve enough source context across units to understand references
such as “all three.” Evaluate and route the units independently as the evidence
justifies it. Corrections should invalidate affected results and their
dependencies rather than rerun unrelated work.

### Returned Puddlejump review and five approved CTO decisions

Review authority: CTO-carried Puddlejump session, 2026-10-19. Disposition:
**compatible with amendments**, with no identified duplication/conflict with
ratified canon. The review corrected four omissions in the first reconnaissance:

- **A — A cloud path already exists.** Switchboard commit `8911893` dispatches
  LinkedIn copy to Core `writing.tasks.generate_linkedin_copy_with_claude_code`
  on queue `catalyst`. It checks `ActionRun.cloud_approved`, runtime READY and
  `allowed_ai_modes`, then reaches the shared runner as the runtime Linux user.
  Reuse/generalize this path with its server-login fallback removed; it is
  Group-scoped today. Do not build a third Claude route or copy Inkwell's direct
  Claude path, which is under review in `zz/spike-direct-calls.md`.
- **B — No-fallback precedent exists.** Atrium's `CodexExecAdapter` resolves the
  runtime from the session sponsor and reports missing/not-ready instead of
  falling back. Use that behavior as precedent, not Atrium's Claude adapter.
- **C — ActionRun hierarchy exists.** `initiatives.ActionRun.parent_action`
  supports child execution records. Decision 1 now settles the parent at initial
  interpretation; use SH-7b's built shared `start_weave` function.
- **D — Findings reuse Contour.** The reviewed recommendation is Contour
  Sightings, not an independent findings ontology. A Sighting carries Shape id,
  version, confidence, and source location; uncertainty belongs in the Shape's
  `uncertain` field. A Strategy takes source material in and returns Sightings.
  Unconfirmed Sightings evaporate. Decision 4 now approves this for Shuttle;
  the concrete Sighting fields were subsequently approved in this session.

Local source inspection confirms A's dispatch/task checks and fallback, B's
runtime failure handling, C's model field, and D's Shape Library definitions.
It does not verify the server's live configuration.

| CTO decision | Approved by CTO, 2026-10-19 |
|---|---|
| **1. Envelope and child accounting** | Call shared `shuttle.services.start_weave(weave_in=..., author=...)` first; create child execution ActionRuns via `parent_action`. Later attach the packet with `hold_packet` to the same envelope. This shared entry point is built in Core `bbfffc4d`. |
| **2. Person → runtime identity** | Resolve `TenantClaudeRuntime` for tenant `users.CustomUser` (UUID pk), no schema change. Missing/not-ready is a visible error with no fallback. The envelope's `tenant_id` remains the platform default; person-as-tenant applies to runtime resolution only. |
| **3. Execution placement** | Core asks; Switchboard routes and gates; Inkwell executes local work; permitted cloud work runs in a Core worker under the person's runtime, generalizing the LinkedIn path without its fallback. No routing in mobile or Inkwell; no third Claude path. |
| **4. Findings/Shapes** | Contour Sightings. Shuttle Shapes and the weave-to-packet Strategy live on a Contour shelf. Recognition Vocabulary lives in the separate Request-Shape Library. OQ4 and capability name `shuttle_weave_interpret` are approved. Sighting fields were returned and approved before registration. |
| **5. Policy authority** | SW-9 is the single cloud enforcement point; most-restrictive applicable policy wins. Joining runtime privacy and Group dispatch policy into SW-9 is later work, not a gate for the CTO's first trial. |

Review distinguishes document authority: ADR-0058 and Switchboard ADR are
ratified; SW-9 is enforcement only and SW-10 is not started. Governed Verb
Envelope and capability-routing coherence note are drafts; the Field is
proposed; Scaffold is draft. Contour is settled in its ratified hand-touch
glossary (2026-10-19). Do not elevate the drafts/proposals through this plan.

**Approval checkpoint and remaining live-execution gates:**

1. **Decisions and contract approved.** All five decisions, OQ4, capability
   name, and findings fields are settled; implementation artifacts come next.
2. Server admin confirms the CTO runtime is READY and its `allowed_ai_modes`
   permits this work; the phone does not configure the runtime.
3. Close SW-9's upstream approval-recording item: Core records the person's
   cloud approval in `cloud_approved` and `approval_payload` on the relevant
   ActionRun before dispatch. Execution permission is separate from approval
   to publish. Verify approval binding to the actual task/input/revision.

The Switchboard escalation comment saying no cloud backend exists is outdated;
do not use that comment as a readiness or policy conclusion. Privacy-forbidden
cloud execution must return explicit unavailable with nothing sent.

### Existing pieces and proposed boundaries

| Concern | Proposed reuse | What Puddlejump must verify |
|---|---|---|
| Capture/transcription | Mobile `CaptureDock`, voice-Seed API, shared transcript refresh | Preserve one implementation; verify privacy policy covers audio/transcription too |
| Identity and runtime selection | Core `TenantClaudeRuntime` metadata and existing onboarding | Establish authenticated person → authorized tenant/runtime → Linux account; current management API is Group-scoped |
| Capability dispatch | Switchboard typed registry and `switchboard.capability_async`, demonstrated by Folio tending | Confirm this is the right extension point and overlaps with other planned capability work |
| Local cognition | Inkwell and existing schema-constrained capability execution | Agree unit contracts and eligible local backends; avoid duplicate routing rules |
| First cloud backend | Existing Switchboard → Core LinkedIn task → shared runner, explicit `run_as_user` | Generalize behind the capability seam; remove account fallback; placement approved in decision 3 |
| Response and corrections | Existing authenticated API, async status and/or Atrium exchange transport patterns | Choose a narrow findings/correction API; do not inherit Atrium's implicit process account or broad session context |
| Audit and lifecycle | Existing ActionRun recording, `parent_action`, and SH-7b envelope | Use `start_weave`, keep parent pending, account for each execution as a child |
| Findings contract | Contour Shapes, Sightings, and Strategy contracts | Contour shelf and concrete fields approved; no separate findings ontology |
| Client integration | Shared `packages/api` types/client, mobile findings view | Keep provider details out of UI; shared client must also be usable by web |

Local source shows Atrium's Claude adapter does not currently pass
`run_as_user`; Catalyst's runtime preflight has a legacy server-account fallback
when no runtime exists. Neither is a template to copy unchanged. The capability
path inspected currently calls Inkwell; the separate LinkedIn path already
dispatches cloud work to Core and is the nearer cloud precedent. Extending that
to Shuttle remains unbuilt. Runtime onboarding and
failure UI are partly unfinished. Deployment readiness is unverified.

Claude Code runs in the person's server Linux account using their own provider
login, per the CTO's direction and stated prior terms review. That provides
account isolation; the model remains remote. A missing/unready runtime never
falls back to another person's or the server's account. Provider credentials,
Linux usernames, and working-directory selection stay server-side.

Keep a later Codex adapter possible through the same capability/result
boundaries. Existing Codex-related runtime code is not evidence that this
workload is ready. Implementing that adapter is outside the first slice.

### Proposed implementation sequence, after review

**Amended sequence authorized within the five returned decisions.**
Implementation may proceed now; the live-execution gates apply before dispatch
to a real model:

1. Implement the approved Contour Sighting/Strategy fields; placement and capability name
   are also approved. Preserve SH-7a unchanged. Use Stackroom retrieval for Idea candidates,
   never Inkwell's direct Qdrant access: the review identifies differing
   embedding models (`zz/spike-direct-calls.md`).
2. Core implements interpret/correct endpoints using the built `start_weave`
   function, with execution children via `parent_action`. Use the same author
   for subsequent `hold_packet`/`get_held_packet` initiator checks. Never create
   a second envelope or resolve runtime identity from the platform tenant id.
3. Switchboard registers one capability over `capability_async`, with a backend
   seam behind SW-9. Source preparation remains deterministic; Inkwell returns
   derived hash/spans without keeping records, while Core retains the source.
4. Core generalizes the LinkedIn-style cloud runner with person-runtime lookup,
   READY/mode checks, approval verification, and no server-account fallback.
   Core also checks returned source/story spans deterministically.
5. Add Sighting/findings and correction types beside the SH-7a types in
   `packages/api`, then connect Shuttle's concise reading and same-weave
   correction flow. A correction carries weave ActionRun id plus revision;
   original text is immutable and stale results are dropped.
6. Replay three-choirs, a less explicit connection, a correction, and an unrelated
   item; then compare local models on the same discrete unit contracts.

**Later work, not gates for the CTO's first cloud test:** local-model rollout,
Codex support, full joining of policy sources, person-runtime onboarding UI,
privacy-client transcription pinning, publication via SH-7b/SH-8, and SH-10 map
work. Local transcription pinning is still required before serving a local-only
privacy client; it is not waived by being later than the CTO's test.

The detailed deliverable descriptions below explain the sequence above; they
do not override the approved decisions, approved contract, or remaining live-run gates:

1. **Resolve placement and dependencies.** Return the review decisions listed
   below. Verify the test account and deployed prerequisites before a live run.
2. **Agree the intermediate contract.** Version findings and correction
   inputs/outputs, with source references, proposed connections/evidence,
   verbatim stories, uncertainties, revision identity, and explicit failure
   states. Approve task contracts and capability names before registration.
   This is not a silent extension to SH-7a; any change there goes to the CTO.
3. **Implement shared interpretation execution.** Extend the agreed existing
   capability/task machinery; enforce effective privacy policy before backend
   execution and use the person's authorized runtime for permitted Claude
   work. Keep units independently testable and local-model compatible.
4. **Expose the same-weave exchange.** An authenticated Core API starts an
   interpretation and accepts corrections against the current revision. Use
   existing result/status patterns. Reject or ignore stale results; avoid
   duplicate work on retried submissions. Streaming is optional for this test.
5. **Return findings in Shuttle.** Replace copy/paste with the concise reading
   and a correction affordance. Reuse shared capture for spoken follow-up if
   supported in the approved slice. Keep the current sample review available;
   retain the original telling separately from interpretation and corrections.
6. **Exercise the loop and compare execution.** Run the actual telling and
   contrasting cases, then evaluate local models on the same unit contracts
   and examples. Record quality, accepted/corrected interpretations, latency,
   prompt/model versions, and available usage information. Broaden only when
   the CTO has assessed the lived flow.

### Acceptance and limits

- The proposed connection is supported by quoted words such as “So all three
  of those” and “singing together is the key thing.” Topic similarity alone
  does not establish intended adjacency. One coherent cluster-level intention
  can support several proposed edges without forcing repetitive questions.
- The first trial returns three candidate groups, one firsthand story, and
  uncertainty around names/locales. It does not silently import Brisbane from
  a fixture, complete the unfinished story, invent addresses, or assert an
  existing database match.
- A correction updates the relevant findings in the same weave and preserves
  original text. Older results cannot overwrite the corrected reading.
- Account isolation, runtime-not-ready, authentication failure, timeout,
  malformed output, and policy-forbidden cloud execution have explicit tested
  behavior. No silent cloud escalation or account fallback is allowed.
- Privacy restrictions cover source preparation, transcription, retrieval and
  embeddings, every interpretation unit, and retained context. “Intent to
  publish” is not blanket consent to external processing.
- Local-only execution can use eligible local models for some/all units. When
  insufficient, surface uncertainty/unavailability or ask a useful question;
  never send the work to cloud without the required policy and approval.
- This slice does not publish Commons objects, change audiences, implement
  a new Commons map, replace SH-7b/SH-8, or complete SH-11. Packet assembly and
  confirmation remain the following integration, with one approval to publish.

### Puddlejump verification request and expected return

Please verify this sub-plan against **existing implementations and other
planned builds**, not only against Shuttle's own ADR. Start with ADR-0058,
SH-7a/SH-7b/SH-8, the governed envelope, Switchboard's capability-contract work
and Folio async precedent, Inkwell/Scaffold, the Field resourcefulness position,
the coherence note on capability routing, Catalyst's tenant-runtime ADR, and
Atrium's exchange/dispatch work. Supporting source paths are in the linked
integration findings. Distinguish ratified decisions, draft positions, source
implementation, and deployed verification.

Return the following for the CTO to carry back to this session:

1. **Disposition:** compatible, compatible with amendments, or blocked; cite
   governing documents and identify conflicts or duplication.
2. **Reuse map:** for every proposed unit/boundary, mark existing, extension
   required, planned elsewhere, or new; name its owner/repo and dependencies.
3. **Execution placement:** where shared interpretation orchestration lives,
   how Switchboard reaches the Claude runner, and how Inkwell local execution
   participates without a second router or provider-specific mobile coupling.
4. **Identity/privacy decisions:** person-to-runtime resolution, effective
   policy authority/precedence, permitted cloud approval flow, and missing
   enforcement or onboarding work that must be completed first.
5. **Contract/lifecycle decisions:** findings/correction contracts, capability
   registrations, revision handling, source retention, and interpretation-job
   accounting relative to one envelope ActionRun per weave. Identify any
   SH-7a changes requiring explicit CTO approval.
6. **Amended sequence:** owners and prerequisites for the smallest first
   interpretation/correction test; separate essential gates from later local
   model rollout, Codex support, publication, and map work.
7. **Implementation-ready handoff:** approved scope, unresolved decisions to
   put to the CTO, acceptance cases, and the revised sub-plan text. Do not
   label an unresolved proposal as settled architecture.

**Review boundary:** Puddlejump verification and the five CTO decisions have
returned. The findings contract was also approved in this session. Implement its
artifacts and register the capability within that scope, then satisfy runtime/mode
readiness and upstream cloud-approval recording before any live interpretation execution.

## Preserve the packet work

The three-choirs review remains intact under **Open sample packet**, collapsed
initially. Checkmarks, the near-duplicate merge choice, Idea wording, adjacency
reasons, story/music fields, sample confirmation, and reference result are
available for later review. Opening or resetting the sample does not use,
replace, or interpret the real capture.

The fixed result fixture describes only the fixed confirm fixture. Edited
sample choices must never claim that same result as an actual server response.
There is no Publish action for the real telling in this pilot.

## Integration after the trial

The full acceptance path remains spoken weave → shaped packet → one approval
→ Commons map. SH-7b supplies the governed envelope; SH-8 supplies the agent
shaping/verb. Wire the real transcript into that path when the services and
their decisions are ready. Map verification also depends on SH-10/Commons
map work. Keep the SH-7a contract unchanged unless the CTO approves a change.

The mobile UI must not pretend that a local keyword parser or a static packet
understands the person's telling. The interpretation trial supplies examples
and feedback for the real agent integration.

## Validation and device loop

From `apps/mobile`, local checks need installed dependencies but no backend:

```bash
./node_modules/.bin/tsc --noEmit --pretty false --incremental false
node pre-tests/shuttle-review.cjs
git diff --check
```

Actual capture/transcription needs a signed-in account, a reachable configured
API, and its transcription worker. Socket delivery accelerates updates; polling
is the fallback. Voice recording needs microphone permission.

The CTO builds and installs the standalone QA app on the Samsung Note 20:

```bash
./run_android_release_install.sh --device RFCN707FJET
```

Keep Build and Folio hidden from the bottom bar for now. Do not use `--clean`
for ordinary UI changes. The CTO installed the refined screen, recorded a
weave, and used the transcript handoff successfully. Later prompt/UI changes
still need rebuilding and on-device verification.

## CTO handoff to the governing plan

For the Puddlejump session to fold into Shuttle status/Appendix A:

> SH-11 is in progress. Before automatic packet review, run a real capture and
> interpretation trial: shared Notebook capture/transcription at the top of
> Shuttle, verbatim transcript, person-controlled handoff to the working
> conversation, and a report of entities, Places, Ideas, connections, stories,
> and uncertainties for CTO feedback. Preserve the sample review behind an
> explicit action. Notebook is private capture; Shuttle expresses intent for
> near-term Commons publication, always requiring approval. Storyline as a
> friends-only middle position is a future direction. Real packet shaping and
> publication still depend on SH-7b/SH-8, and map verification on SH-10. The
> SH-7a contract is unchanged.

This is a mobile working plan and a relay note, not an update to Puddlejump
canon. The mobile pilot and pending-decision plan were checkpointed in
`d27bfc09` before the CTO's five answers returned. The commit handoff was supplied
to the CTO for logging; this session does not write a Puddlejump build-log entry.

Historical canonical-doc check before that checkpoint (2026-10-19): the Shuttle ADR and
status document have saved but uncommitted edits in the Puddlejump checkout.
OQ4 remains open there, and the proposed parent/child accounting refinement is
not yet recorded. `zz/spike-direct-calls.md` has no working-tree diff and is
committed through `4c3b4ac`; Claude-call placement remains an open spike question.
Those observations preceded the decision return. The later handoff and current
local ADR v0.1.3/status now record all five decisions, OQ4 resolution and the
shared `start_weave` function (`bbfffc4d`). Findings fields were explicitly approved
subsequently in this session; this approval was recorded on 2026-10-20.

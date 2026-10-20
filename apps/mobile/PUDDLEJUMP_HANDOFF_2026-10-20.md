# For Puddlejump — Shuttle interpretation and Contour handoff

2026-10-20 · CTO relay · ADR-0058 / SH-11

**Historical intake note, retained as the original handoff.** Puddlejump has
since recorded the builds, taken in the draft Contour bundle (`4eff4d5`), and
amended the whole-weave practice (`f3cf69f`, practice alignment `16df403`). The
CTO reports deployment/restarts; personal runtime setup and live acceptance
remain outstanding. Current integration direction and ownership are in
[SHUTTLE_BUILD_PLAN.md](SHUTTLE_BUILD_PLAN.md) and the
[Blue handoff](BLUE_AGENT_HANDOFF_2026-10-20.md). Older future-tense statements
below describe the handoff checkpoint, not current pending work.

The approved interpretation/correction slice is committed locally. The CTO plans
to rebuild the Note 20 app, then deploy across the four repos. Deployment and
the first live model run have not yet been verified. Please log the implementation
checkpoint separately from live acceptance and completion of SH-11.

## Commit set

| Repo | Commit | Work |
| --- | --- | --- |
| mixtape-release-core | `65869eac` | Weave start/status/interpret/correct APIs, child ActionRuns, findings validation, bounded person-runtime worker |
| mixtape-release-switchboard | `e517449` | `shuttle_weave_interpret` registration and SW-9-gated backend dispatch |
| mixtape-release-inkwell | `efb0554` | Local interpretation handler using the existing loaded model; Inkwell keeps no records |
| mixtape-release-frontend | `59eb6045` | Mobile findings/corrections, shared API types and fixtures, Contour bundle and documentation |

Frontend `299b2e03` records the preceding approved plan and findings contract.
Full per-repo build-log entries are in
`apps/mobile/SHUTTLE_COMMIT_HANDOFF_2026-10-20.md` at Frontend `59eb6045`.

## Contour artifacts for intake

Source: Frontend `59eb6045`, `apps/mobile/contour/shuttle/`.
Intended destination: `puddlejump/reference/contour/shuttle/`, subject to
Puddlejump's established library intake and manifest conventions.

The bundle contains six Shapes at `0.1.0`: `shuttle.weave`, `shuttle.thing`,
`shuttle.place`, `shuttle.idea`, `shuttle.adjacency`, and `shuttle.story`.
Each has a Shape definition, JSON schema, Markdown template, extraction guidance,
and validation guidance. It also includes the `shuttle.weave_to_packet` Strategy,
its reasoning companion, and an additive `manifest.fragment.yaml`.

The fields and placement were approved by the CTO; the packaged library entries
still say `draft` pending canonical intake. Please validate the bundle against
Contour conventions, integrate the appropriate manifest entries, and record its
canonical status. Do not equate contract approval with completed library intake.
The Recognition Vocabulary remains in the separate Request-Shape Library.

Despite its eventual name, the Strategy currently yields provisional Sightings
for correction. It does not assemble or publish a packet. Raw input is the
immutable Seed transcript, not a previously interpreted weave reading.

## What the implementation preserves

- Notebook and Shuttle share capture, voice upload, and transcription.
- Core calls `start_weave` for the parent envelope; execution runs are children.
  The parent remains pending for later packet handling.
- Core records source-bound cloud approval before dispatch. Switchboard routes
  and gates; Inkwell executes local work; permitted cloud work uses the existing
  Core Claude runner under the person's READY runtime, with no account fallback.
- Findings preserve source spans, verbatim stories, uncertainty, and evidence for
  inferred intent. Corrections append sources; stale results cannot replace a
  newer revision. Resolution currently stays unresolved.

The motivation remains reuse and the larger narrative: discrete cognitive tasks
routed by capability and privacy policy. This first implementation registers one
bounded interpretation capability covering the findings bundle. It does **not**
yet dispatch mention extraction, story attribution, and connection interpretation
as separate model calls. Keep that distinction visible when recording progress;
the local seam and shared contract support subsequent comparisons and finer task
division without moving routing into mobile or Inkwell.

## Verification and next acceptance checkpoint

Passed locally: 33 Core tests, 23 Switchboard tests, two Inkwell tests, mobile
TypeScript and existing Shuttle review checks. Core/API schema and spoken-choirs
fixture are byte-identical. Model execution is mocked.

Before a live telling: verify the person's runtime is READY and permits
`shuttle_weave_interpret`, the account has `initiatives.approve_cloud_dispatch`,
the deployed CLI supports the bounded runner flags, workers have registered the
tasks, and active SW-9 policy plus persisted approval precede cloud dispatch.
A new APK can be built first; live interpretation depends on those server gates.

Then replay the actual three-choirs telling on the phone, correct a name or
connection, and try a less explicit connection plus an unrelated item. Assess
meaning, uncertainty, and the capture-to-correction exchange. Record live results
separately from the mocked checks.

SH-7a is unchanged. SH-1/Stackroom resolution, packet assembly/publication,
Commons map placement, local-model quality, privacy-policy joins, transcription
pinning, and Codex remain follow-up work. Nothing has been published to Commons.

# Shuttle integration reconciliation — Mobile and Blue

2026-10-20. Working build plan under ADR-0058 v0.1.5; records the expected join
between the mobile interpretation slice and the main packet/publication build
line. Whole-weave publication is confirmed (Puddlejump `f3cf69f`), and practice
docs are aligned (`16df403`). OQ8–15 remain CTO decisions. Exact fixture edits
await Blue's proposal and CTO review. No fixture or behavior changes here.

Use the current [build plan](SHUTTLE_BUILD_PLAN.md) and
[Blue handoff](BLUE_AGENT_HANDOFF_2026-10-20.md) for the governing direction.

## Current state and acceptance boundaries

| Boundary | Current evidence | Remaining work |
| --- | --- | --- |
| Capture and interpretation | Mobile reuses Notebook capture/transcription; findings/corrections use real endpoints; model tests are mocked | Provision and verify the CTO's personal runtime, then run the real telling/correction loop |
| Interpretation to held packet | Blue built Core's deterministic placement over Sightings, matching and packet assembly | Mobile calls `build-packet/` explicitly on the same envelope after successful interpretation |
| Packet review to publication | Blue tested build-packet → confirm → real written rows in tests | Replace fixture-only review with the actual held packet and real `confirm/` call |
| Publication to visible map | Commons CM-12–14 are listed pending in the checked status document | Verify the actual destination surface; scope or complete map work separately if absent |

Blue's main-line implementation completion and Mobile's interpretation
checkpoint are compatible. Neither establishes live phone-to-map acceptance.
The CTO reports all repos pushed and servers restarted; this is deployment
information, not evidence that runtime login, live dispatch, publication, or map
display has passed.

Personal-runtime checks on the server returned no `TenantClaudeRuntime` records
and confirmed the CTO has `initiatives.approve_cloud_dispatch`. The current
direction is the CTO's personal provider login in a dedicated Linux account,
attached to their Mixtape person. No Crossroads sponsorship, credentials, or
fallback. The broader follow-up is
`puddlejump/zz/spike-member-sponsored-cloud-ai.md`.

## Step 1 — Propose the whole-weave fixture changes

**Decision owner: CTO. Core owner: Blue. Shared fixture and UI owner: Mobile.**

The original fixture leaves Low Bar Chorale unticked/resting while confirming
its two edges. Core rejects that combination and rolls back the transaction.
The earlier recommendation to publish two choirs and omit Low Bar's edges is
superseded by the CTO's whole-weave amendment. The intended example is all three
choirs explicitly approved with their intended connections, not implicit
promotion of an unticked endpoint.

Blue proposes the exact confirmation and expected-result changes for CTO review
before editing fixtures. Address Portland's Place/story implications under OQ9:
whole-weave intent does not invent a story, address, match, or map position.
Approval of a thing, its connections, and any Place/story still needs a coherent
contract; do not assume the old per-item-rest rule answers the open question.

After approval, Blue owns Core fixture/semantic test changes and server guards;
Mobile mirrors fixtures byte for byte and implements the chosen review behavior.
OQ8 and OQ13 govern review/checkmarks and any permissible rest following a
visible scope correction. Whole means the person's final intended packet, not
every candidate the model produced. No silent partial publication or endpoint
promotion is authorized.

Keep in Notebook exits the whole session without creating a Shuttle backlog.
The precise terminal ActionRun, source retention, recovery, and proto-Shuttle
Seed representation remain OQ10–12. Routine partial publication plus item Seeds
is no longer the presumed successful path. Original transcripts and necessary
provenance remain protected; no deletion or new deferred-edge queue is implied.

**Message for Puddlejump now:** the principle is recorded in `f3cf69f` and the
practice docs are aligned in `16df403`. OQ8–15 remain open. Next is Blue's exact
fixture/lifecycle proposal plus Mobile's review proposal for CTO decisions.
Runtime readiness and interpretation tests can proceed independently.

## Step 2 — Verify the personal runtime and live interpretation

**Server lead: Blue/server admin. Device and interpretation lead: Mobile + CTO.**

Blue/server admin provisions the dedicated Linux account and person-owned
runtime, permits `shuttle_weave_interpret`, and uses the existing login task
with its verification flow. Confirm user/home, CLI options, worker execution
identity, account permission, and active SW-9 policy. No manually assumed READY
state, Group substitution, or provider credential copy.

Mobile coordinates the device run: capture a natural telling, inspect the exact
transcript, approve source-bound cloud processing, receive findings, and correct
a name or connection. Check the original remains unchanged and stale revisions
cannot replace newer findings. Keep this acceptance separate from publication.

## Step 3 — Wire real packet review and Publish

**Lead: Mobile, including shared `packages/api`. Backend support: Blue.**

Use the existing packet types and review patterns. Add shared API wrappers for:

- `POST /api/shuttle/weaves/<id>/build-packet/`
- `POST /api/shuttle/weaves/<id>/confirm/`

After successful interpretation/correction, an explicit Prepare packet action
requests the held packet on the same envelope ActionRun. Show the real packet,
its matches/merge answers, Idea wordings, adjacency reasons, and story prompts.
Use SH-8's optional `known_story` to carry the exact already-told story into
review; do not require retelling or invent missing stories.

Publish sends the person's deltas to `confirm/`. Show publication success only from the actual response, and interpret any
rested-item result only under the subsequently approved scope/rest rules; handle failures with choices
preserved and prevent duplicate submissions. Keep Open sample packet clearly
separate and available as a development example.

Blue owns backend changes needed for contract discrepancies, authorization,
revision/held-packet validity after corrections, and safe repeated confirmation.
Mobile owns consistent loading/error/retry behavior. Verify together that an
older held packet cannot be published after the person changes the reading.
Agree any missing backend behavior before Mobile relies on it.

Acceptance: actual phone capture → findings → correction → real held packet →
explicit Publish → expected real rows for the whole intended packet under the CTO-approved
endpoint, Place/story, and scope/rest rules. No fixture result may stand in for this run.

## Step 4 — Verify the map destination

**Lead: Blue coordinates with the Commons/map build owner; Mobile owns entry or
navigation from the phone if needed. CTO owns the experience acceptance.**

Inspect the real deployed map and its data path against Commons CM-12–14 rather
than inferring readiness from successful writes. Establish how approved Places,
things, and stories appear, including locales without coordinates. No invented
addresses or map positions to satisfy the acceptance example.

If the destination is not built, record phone publication as passed separately
and assign the remaining map scope. SH-11 wiring alone cannot close phone-to-map
acceptance or SH-10. Test the map only with the material actually approved in
the live run.

## Handoff discipline

Blue owns Core fixtures/placement/confirm, server readiness, and destination
coordination. Mobile owns mobile/shared client changes and phone interaction
checks. CTO resolves approval semantics and controls live publication; Puddlejump
records the decisions and distinct acceptance checkpoints through CTO relay.
No agent should silently broaden ownership across another agent's working tree.

Contour intake is complete as draft library content (Puddlejump `4eff4d5`);
Strategy files use `reference/contour/shuttle/strategies/weave-to-packet.*` with
their manifest entry. Draft status remains until live acceptance. Changes to
findings schemas require Core, shared API, and Contour to stay in step. Inkwell
keeps no records. None of this reconciliation changes the SH-7a fixture yet.

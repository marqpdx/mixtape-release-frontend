# For Blue Agent — whole-weave integration checkpoint

2026-10-20 · CTO relay · ADR-0058 / SH-11

The whole-weave principle is settled in ADR-0058 v0.1.5 (Puddlejump `f3cf69f`).
Good Faith Publishing, agent guidelines and Recognition Vocabulary are aligned
(`16df403`); the Contour Strategy was reviewed. Mobile's
`SHUTTLE_BUILD_PLAN.md` now follows both commits and maps OQ8–15 to owners.

**The earlier Mobile recommendation to publish two choirs and rest Low Bar is
superseded.** The intended example is the final whole three-choir weave, Low Bar
explicitly approved, with its intended adjacencies. No implicit endpoint
promotion, silent dropping of connections, or routine partial publication that
creates a curation backlog.

Whole means the person's final reviewed intention, not all model suggestions.
Scope/meaning correction stays possible. Publish is explicit and atomic; Keep
in Notebook is the explicit exit. No timer, no lock, no forced publication;
cloud consent, review and publication remain distinct.

## Needed from Blue now

1. Bring the CTO the exact `three_choirs_confirm_in` and `result_out` changes
   expressing the intended whole, including Low Bar. Address Portland and the
   Place/story requirement under OQ9. Do not change fixtures until the CTO has
   reviewed the proposal; do not invent a Portland story or address.
2. Assess backend support for Keep in Notebook and one-session recovery:
   terminal envelope state, existing source Seed reuse, correction/provenance
   retention, held-packet invalidation, and safe retries. Recommend the smallest
   changes, distinguishing existing behavior from OQ10–12 decisions needed.
3. Coordinate with Mobile on the existing build-packet/confirm contracts. Verify
   a corrected weave cannot publish an older held packet; preserve endpoint
   integrity and transactional rollback. Identify missing contract behavior
   before Mobile relies on it.

## Ownership and open decisions

- Mobile owns the review proposal (OQ8), shared API wrappers, phone wiring and
  mirrored fixtures once approved. It will present concrete review states and
  wording, not assume every existing checkmark keeps its old meaning.
- Blue owns Core placement/confirm, canonical fixtures/tests, and the backend
  lifecycle proposal. Coordinate OQ13 (per-item rest after deliberate scope
  correction) with OQ8, and OQ14 (optional Stories Not Yet Told) across both sides.
- Blue/server admin + CTO own personal-runtime readiness. Server checks found
  no `TenantClaudeRuntime` records; the CTO does have cloud-approval permission.
  Use the CTO's personal Claude login/person-owned runtime, with no Crossroads
  sponsorship or account fallback. See `zz/spike-member-sponsored-cloud-ai.md`.
- Blue coordinates the actual map destination with Commons (OQ15), with Mobile
  handling phone entry/navigation if needed. Do not infer map acceptance from
  successful writes or invent coordinates for imprecise locales.
- CTO decides OQ8–15. This handoff does not settle them. Runtime setup can
  proceed alongside the fixture and UI proposals.

The next exchange is Blue's concrete fixture/lifecycle proposal and Mobile's
review proposal, followed by CTO decisions and implementation. Keep live
interpretation, live publication, and visible-map acceptance separate. Nothing
in this note authorizes a live publication or a new runtime policy.

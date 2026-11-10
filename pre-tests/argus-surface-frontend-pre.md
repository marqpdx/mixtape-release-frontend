# Argus Surface — frontend verification

Source: ADR-0064 D8/D9; `puddlejump/zz/_handoffs/handoff-2026-11-09-abe-argus-route.md`.

## Environment contract

Request checks need only installed frontend dependencies: `node pre-tests/argus-run-request.cjs` from the frontend root. No credentials, services or network. Browser checks use the real components with a test-only injected `ArgusClient`. Production always uses the unavailable adapter until Blue's approved wire contract lands. Live tests will require `E2E_BASE_URL`, a superuser and an ordinary member, and Blue's core endpoints/seeded block Initiatives. Do not enable a real run for a UI test.

## Scenarios

- A1: loading/anonymous/ordinary-member identities never mount the Argus work area; superusers can load it. Argus navigation is superuser-only. Core must separately enforce superuser authorization.
- A2: unavailable snapshot shows pending history, coverage and token usage, without claiming zero findings or success; Run now/Create series cannot submit.
- A3: ready blocks can be selected; non-ready blocks cannot. A single run accepts exactly one block and requires explicit caps and confirmation.
- A4: bounded series support days (1–7), explicit local end time, or run count/cadence fitting within seven days. Empty, nonpositive, fractional and unsafe integer caps/cadences/counts are rejected. Core must enforce runtime/global limits too.
- A5: open-ended series say “ask each time”; request has no inherited end/count. Changing any draft field revokes the confirmation. No timer approves runs.
- A6: only server-acknowledged starts/stops/approvals report acceptance. Duplicate clicks while pending make one request. Failed requests show an error and refresh actual state; no automatic mutation retries.
- A7: series show blocks, cadence, span, caps, starter, progress, finding-producing runs and next due time. Stop remains reachable during status refresh. Approve next is only offered for an open-ended series awaiting approval, with core permission.
- A8: failed status refresh revokes start readiness. Stale/out-of-order responses cannot overwrite a newer snapshot.
- A9: block/run result links must be local paths; unknown findings/dates remain unknown. Empty findings are distinct from missing findings.

Use accessible labels and button roles; `.args-*` and `.arun-*` classNames identify layout containers. For failures record scenario, last successful step, actual/expected, screenshot/trace path and suspected owner. API authorization, scheduler enforcement, Cass dispatch, and live follow-up Dialogues remain integration checks owned with Blue/BA2; do not mark AC-6 complete from stub tests.

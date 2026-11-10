# Argus Surface — frontend verification

Source: ADR-0064 D8/D9; `puddlejump/zz/_handoffs/handoff-2026-11-09-abe-argus-route.md`; provisional `puddlejump/zz/api-sketch-argus-surface.md`.

## Environment contract

From the frontend root, run `node pre-tests/argus-run-request.cjs` and `node pre-tests/argus-api-client.cjs`. They compile the real TypeScript and replace only the HTTP transport/route layout for deterministic checks; no credentials, database, network or real runs. The production page now uses authenticated axios calls and React Query. Browser tests should intercept all six documented endpoints with sketch-shaped responses. A real app smoke test requires `/app/argus` (Next basePath `/app`), a superuser, core endpoints and seeded block Initiatives. Core migrations and real runs remain with Blue/CTO/BA2.

## Scenarios

- A1: loading, anonymous, member and staff-only identities never mount the work area; superusers can. Navigation is superuser-only. Queries are scoped by identity, and the page remounts on an identity change. API authorization must still be enforced in core.
- A2: missing/forbidden block data shows an error and unavailable run controls; empty successful results say no blocks. Failed queries do not retry indefinitely. Failed active-series reads show a per-series error, preserving a previously known Stop control.
- A3: select a ready block and explicitly approve Run now. It sends no undocumented body fields. The sketch does not specify custom single-run caps; no custom-cap inputs are offered for this mode. A `not_reachable` response displays its detail and must not report a run as started; `started` needs a run ID.
- A4: bounded series send exactly one block_slug, whole cadence_hours, span {kind: days|runs, value}, and per_turn_caps. Require positive whole caps, 1–7 days, or count/cadence fitting before seven days. Never round minute cadences, convert an exact end time, or fan out a multi-block consent.
- A5: open-ended series/exact end times are unavailable pending their contract. Null runs_total on a day-bounded series does not make it open-ended. Changes to a form revoke confirmation. No timer approves or starts runs.
- A6: mutations are never optimistically recorded or automatically retried (including shared axios token-refresh replay). Double clicks send one request. Failures remain visible after status invalidation. Stop requires the matching series ID with status stopped.
- A7: discover active series from blocks.active_series_id, plus IDs acknowledged on creation. Show server-reported day/count progress, caps, starter and finding-producing run count. Poll active series; stop polling terminal/error states. Keep a created/stopped series in the identity-scoped query cache while navigating between sections.
- A8: selecting a block fetches its detail lazily and shows runs and findings. Failed history reads show an error. Empty structured findings say no structured findings reported, not clean. Unknown counts/coverage/usage stay unknown.
- A9: detail links must be local paths. The client's actual paths/trailing slashes, GET cancellation signals, mutation bodies, identifier encoding, run-state discriminant and stop acknowledgement are checked with inert axios.

Use accessible labels and button roles; `.args-*` and `.arun-*` identify layout containers. For failures record scenario, last successful step, actual/expected, screenshot/trace path and suspected owner. Full auth/API authorization, scheduler enforcement, Cass dispatch, G6/AC-7 readiness and follow-up Dialogues remain integration checks. Do not mark AC-6 complete from mocked API tests.

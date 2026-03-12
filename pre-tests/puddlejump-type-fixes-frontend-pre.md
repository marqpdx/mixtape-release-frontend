# Puddlejump — Type & Contract Fixes Frontend Pre-Test

**Scope**
Validate that frontend behaviour correctly reflects the type corrections made during the puddlejump fidelity pass (2026-03-11). Changes were type-level only (D3, D6, D7, D8) — no UI was changed. Tests confirm that the API client and hooks behave consistently with the corrected types.

**Key Changes**
- `PuddlejumpExportResponse` is now `Blob` (was a signed-URL JSON object) — D6
- `PuddlejumpConstraints` now includes `max_size_bytes` — D8
- `PuddlejumpApiEndpoint` URLs now use `/api/stackroom/puddlejump/` prefix — D7
- `PuddlejumpSyncState` comment no longer references "Phase 4" — D3 (comment only, no runtime impact)

---

## Preconditions

- Frontend dev server running
- User logged in with a personal Puddlejump library containing at least one file
- Django backend running with the updated endpoints

---

## Section A — Export Behaviour (D6)

The export endpoint streams a zip directly. There is no JSON response with a `download_url`. The API client should return a `Blob`.

### A1) Export triggers file download, not a redirect

**Steps**
1. Navigate to a Puddlejump library view
2. Click the export/download action

**Expected**
- [ ] Browser initiates a file download (`.zip`)
- [ ] No redirect to an S3 or external URL occurs
- [ ] Downloaded file is a valid zip (can be opened locally)
- [ ] No console error about `download_url` being undefined or null

**Triage if fails**
- If redirect occurs: check `puddlejumpApi.ts` — export client must be handling a `Blob`, not a JSON response
- Owner: `frontend`

---

### A2) Export response carries bundle ID in header

**Steps** (via browser DevTools Network tab)
1. Trigger an export
2. Inspect the response headers for the export request

**Expected**
- [ ] `X-Bundle-Id` header is present with a UUID value
- [ ] `Content-Type` is `application/zip`
- [ ] `Content-Disposition` contains `attachment; filename=...`

---

## Section B — Constraints Propagation (D8)

`PuddlejumpConstraints` now includes `max_size_bytes: number`. Any UI that surfaces constraints should reflect this.

### B1) Import validation uses 50MB limit

**Steps**
1. Attempt to import a bundle > 50MB via the import UI (or construct a multipart POST with a large file)

**Expected**
- [ ] Server returns 400 with a size error
- [ ] UI surfaces the error message (does not silently fail or show a generic error)
- [ ] No console TypeScript error related to `max_size_bytes` being an unknown property

---

## Section C — API URL Prefix Regression (D7)

All Puddlejump API calls must use `/api/stackroom/puddlejump/` — not the old `/api/puddlejump/` prefix.

### C1) Personal library loads correctly

**Steps**
1. Open the Puddlejump section of the app

**Expected**
- [ ] Library data loads (HTTP 200 on `GET /api/stackroom/puddlejump/personal`)
- [ ] No 404 errors in the Network tab for any Puddlejump API call
- [ ] No requests to `/api/puddlejump/` (old prefix) appear in Network tab

**Verify in DevTools**
- [ ] Filter Network tab by `puddlejump` — all requests use `/api/stackroom/puddlejump/` prefix

---

### C2) Sync status loads correctly

**Steps**
1. Open the Puddlejump sync/files view

**Expected**
- [ ] `GET /api/stackroom/puddlejump/sync/status` returns 200
- [ ] File list renders without error

---

## Regression Checks

- [ ] Import flow still works end-to-end (upload bundle → receive completion response)
- [ ] Sync upload/download/delete still work
- [ ] Utility endpoints (health, duplicates, glossary, canonical, summaries, restructure) still return data
- [ ] Canon governance views (versions, diff, checkout, checkin) still function
- [ ] No TypeScript compilation errors in the `puddlejump.ts` types file (`tsc --noEmit`)

---

## Notes

- D3 (`PuddlejumpSyncState` comment change) has no runtime impact — no test needed.
- Type-level changes only cause failures if the frontend was depending on the old incorrect shape (e.g. destructuring `response.download_url`). The regression checks above catch this.
- If the export test (A1) fails with a JSON parse error, the API client may be calling `.json()` on the streaming response instead of `.blob()` — check `puddlejumpApi.ts: exportLibrary`.

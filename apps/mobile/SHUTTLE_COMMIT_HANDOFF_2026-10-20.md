# Shuttle interpretation commit handoff — 2026-10-20

For CTO relay to Puddlejump. This session has not written to Puddlejump, pushed
commits, deployed services, changed runtime accounts, or built a new APK.

## Commit records

Repo:         mixtape-release-core
Commit:       65869eac — feat(shuttle): add governed weave interpretation and correction
Date:         2026-10-20
Work effort:  ADR-0058 / SH-11 interpretation and correction
What was built:
  Added authenticated `/api/shuttle/weaves/` start, status, interpretation and
  correction endpoints around `start_weave`, with child execution ActionRuns
  and immutable revisioned source snapshots. Added strict Sighting validation,
  source-bound cloud approval, person-runtime resolution without fallback, and
  a bounded worker using the existing Claude runner. Stale results are ignored;
  the parent envelope remains pending for later packet work.

Repo:         mixtape-release-switchboard
Commit:       e517449 — feat(shuttle): route interpretation through the SW-9 cloud gate
Date:         2026-10-20
Work effort:  ADR-0058 / SH-11; Switchboard SW-9
What was built:
  Registered `shuttle_weave_interpret` in the existing async capability registry.
  Added a backend seam that applies SW-9 and records dispatch proof before
  handing permitted cloud work to Core; local work continues through Inkwell.
  Most-restrictive applicable tool policy is preserved across configuration layers.

Repo:         mixtape-release-inkwell
Commit:       efb0554 — feat(shuttle): add stateless local weave interpretation capability
Date:         2026-10-20
Work effort:  ADR-0058 / SH-11 local capability seam
What was built:
  Added the `shuttle_weave_interpret` handler using the existing loaded local
  model and a supplied JSON grammar. It returns findings and execution
  provenance without storing sources or choosing an execution backend.

Repo:         mixtape-release-frontend
Commit:       The commit containing this handoff — feat(mobile): review and correct Shuttle interpretations
Date:         2026-10-20
Work effort:  ADR-0058 / SH-11
What was built:
  Added the Shuttle findings and correction panel and shared API client/types,
  with exact spoken-choirs fixtures and schemas matching Core. The screen reuses
  Notebook capture and transcription, requests cloud consent, displays evidence
  and verbatim stories, and retains the manual interpretation fallback. Packaged
  the six Contour Shapes and Strategy for CTO relay and updated the working docs.

The earlier approval/contract record is Frontend `299b2e03`.

## Verification record

- 33 targeted Core tests passed using `crossroads_test_shuttle_20261020`.
- 23 Switchboard tests and two Inkwell tests passed.
- Mobile TypeScript and existing Shuttle review checks passed.
- Commit review confirmed all 27 staged backend/API files still matched that
  checkpoint; Core/API schema and fixture bytes matched; whitespace checks
  passed across all four repos.
- Model calls are mocked. Live runtime, queues, server policy and model quality
  remain unverified.

## Next checkpoint: first live interpretation and correction

1. Relay these commit records and `contour/shuttle/` to Puddlejump. Record the
   Contour shelf artifacts through its established library process.
2. Review the coordinated deployment set. Verify the person's Claude runtime is
   READY, its Linux user/home are correct, `allowed_ai_modes` includes
   `shuttle_weave_interpret`, and the person has
   `initiatives.approve_cloud_dispatch`. Verify the deployed CLI supports the
   bounded runner options.
3. Deploy Core/Switchboard/Inkwell together and restart their relevant workers.
   Verify active SW-9 restrictions and approval persistence before any cloud
   dispatch. Do not assume passing mocked checks verifies the live gate.
4. The CTO builds/installs with `run_android_release_install.sh`. Record a real
   telling, review the source-bound consent, then inspect the reading, inferred
   connections, exact story, uncertainty and questions on the phone.
5. Correct a name or connection and replay. Confirm the original stays intact
   and older results cannot overwrite the newer revision. Replay a less explicit
   connection and an unrelated item before tuning prompts further.

Entity resolution currently stays unresolved; SH-1/Stackroom retrieval remains
follow-up work. Packet approval/publication and map placement remain later
phases. Local-model comparisons use the same findings contract and bounded
units; this seam supports capability/privacy routing but does not claim local
quality or the later privacy-policy joins are complete.

The unrelated `apps/mixtape/public/help-manifest.json` change is excluded.

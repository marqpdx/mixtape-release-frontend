# SH-11 live publication review checkpoint

Real review now uses `POST weaves/<id>/build-packet/`, `confirm/` and
`keep-in-notebook/`, via transport functions in `packages/api/clients/shuttle/`.
No shared API barrel or Contour schema was changed. Capture still uses the
Notebook recorder, voice upload and transcription path. The sample remains an
explicitly separate example; it cannot call live publication.

The live review presents things/Places, matches, Ideas, connections and stories.
Known stories prefill verbatim. Selected Places require a first story; selected
connections require both endpoints; near-duplicates require an explicit decision.
Publish asks for final permission for the selected coherent scope. Deliberate
exclusions are named in that confirmation; they are not a Shuttle work queue.
Keep in Notebook explicitly ends the attempt through Blue's endpoint.

One account-scoped active session persists source Seed/start request/envelope IDs.
It contains no transcript or source text. Interpretation restores from Core after
an interruption; closing via Keep in Notebook clears the active client pointer.
A saved publication attempt marker is written **before** confirm dispatch. Neither
UI nor transport retries confirm, including the shared interceptor's 401 replay.
A received result is cached as record IDs and shown as server-confirmed publication;
this does not claim map placement. A lost response (or interrupted persistence of
its result) blocks another Publish and states that publication may have completed.
Blue's terminal-result lookup contract is still required to recover that state.
A storage failure before the marker is saved prevents dispatch.

Checks: mobile TypeScript; offline review/selection checks; actual shared Axios
interceptor with fake transport proving no confirm replay after 401; same-envelope
routes; persisted marker/account isolation/explicit clearing. No production calls,
cloud execution, device build or publication were performed by these checks.

Still to verify live: runtime and current server compatibility; correction → review;
first stories and merge choices; Keep in Notebook; process-restart restoration;
successful confirm and result presentation; unknown-result recovery after Blue's
lookup lands. Map acceptance remains SH-10. Local typed story edits currently
remain in component state while reviewing; the original source and server findings
are preserved, but unsubmitted form edits are not a durable draft queue.

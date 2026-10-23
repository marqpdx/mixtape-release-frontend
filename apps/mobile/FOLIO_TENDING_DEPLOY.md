# Folio tending: failure visibility and production pause

CTO decision D, 2026-10-23, in Puddlejump's Folio orientation/cloud/local bundle.

The Folio Note API now returns `tending_error`. Mobile and the Workbench show
**Tending failed** when tending fails, rather than presenting a failed pass as
an ordinary Unplaced note. Writer-confirmed Shapes remain visible. The note,
recording, transcript, and previous derived data remain available; tending failure
is separate from transcription failure. The Workbench's provenance includes the
reported error. Starting a new tending run clears its previous error.

## Production deploy

Set `FOLIO_AUTO_TENDING_ENABLED=False` in the Core deployment environment, then
restart the Core API and workers that capture/transcribe/tend Folio notes so they
all read the new setting. The default is True, preserving existing installations.
The CTO owns the production configuration and restart; this code change does not
change a running server's environment.

With the setting false:

- Text capture and voice transcription still persist normally.
- Capture and transcription do not enqueue automatic local tending.
- A tending task already queued in Core skips dispatch without creating an ActionRun.
- Stackroom ingestion remains enabled and is outside this Folio-tending switch.
- Work already dispatched to Switchboard is not cancelled by this setting.

This temporarily pauses the existing local `folio_note_tend` path. It does not
introduce Claude routing or a second interpretation pipeline. The shared
Intelligent Parsing Service extraction and verified SW-9 gates precede Folio's
new cloud interpretation slice.

## Checks

Core `folio.tests.test_notes`: 22 tests passing, including paused text capture,
paused voice transcription, queued-task suppression, exposed error/source and
confirmed-Shape preservation, and retry error clearing. Mobile TypeScript passes.
Production behavior and device rendering still require deploy and a device check.

Next: SH-11 real review/publication wiring; separate Folio slug change; Folio
interpretation UI design against the IP-0 contract, implementation after IP-2.

---
title: OCR Recognition Pilot
subsystem: spikes
area: ocr
excerpt: The OCR Recognition Pilot is an isolated spike surface for uploading artifacts, running local recognition, reviewing text, and recording evaluation notes.
routes:
  - /spikes/document-recognition
workAreas: []
tags:
  - spike
  - ocr
  - recognition
  - catalyst
---

# OCR Recognition Pilot

The OCR Recognition Pilot is an isolated evaluation surface. It lets you upload PDFs or images, run local recognition, compare the source page with recognized text, make corrections, and record whether the result was useful.

Nothing you upload here enters Catalyst, Stackroom, Find, or any canon workflow.

## What you can do here

- Upload one artifact at a time.
- Set privacy sensitivity before recognition.
- Run local recognition.
- Edit recognized text in place during review.
- Escalate a page to cloud recognition when privacy settings allow it.
- Mark a page unreadable when transcription is not worth the effort.
- Save feedback about the pilot screen itself.

## Privacy sensitivity

**Low** means cloud escalation is acceptable for the spike if useful.

**Medium** means cloud escalation is allowed only with explicit reviewer confirmation.

**Complete** means the artifact or page must never be sent to cloud AI.

## Current limitations

- This is a spike, not a production document library.
- PDF page rendering may still be basic in the first implementation.
- Recognition output may use a placeholder adapter until the local OCR engine is fully connected.

## Related features

- **Catalyst** — Future knowledge workflows may use lessons from this spike.
- **Stackroom** — This spike does not ingest files into Stackroom.

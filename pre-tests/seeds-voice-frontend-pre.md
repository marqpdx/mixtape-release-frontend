# Voice Seeds v1 Frontend Test Plan

Scope: Validate Voice Seed capture flow on `/app/seed` (record, upload, transcribe display).

Target UI:
- `apps/mixtape/src/app/(authenticated)/seed/page.tsx`

Assumptions:
- User is authenticated.
- Backend voice seed endpoints are live.
- Microphone permissions can be granted.

---

## A) Record + send

### A1. Start recording
Steps:
1) Navigate to `/app/seed` on mobile or desktop.
2) Click the microphone icon.
Expected:
- Recording starts (mic icon becomes “stop”).
- No errors in console.

### A2. Stop recording
Steps:
1) Click stop icon.
Expected:
- Audio preview appears below the textarea.
- Textarea becomes disabled while voice is queued.

### A3. Send voice seed
Steps:
1) Click Send.
Expected:
- Upload occurs.
- Input clears.
- New seed appears in list with “Transcribing…”.

---

## B) Upload file

### B1. Upload via file picker
Steps:
1) Click upload icon.
2) Choose an audio file.
Expected:
- Upload succeeds.
- New seed appears as “Transcribing…”.

### B2. Unsupported format
Steps:
1) Attempt to upload a non‑audio file.
Expected:
- Upload fails with error (browser console or toast).
- No new seed created.

---

## C) Processing → Ready

### C1. Transcription updates
Steps:
1) Wait 10–30s after upload.
Expected:
- “Transcribing…” label is replaced by transcript text.
- Seed now shows transcript text (truncated to 3 lines).

### C2. Audio playback
Steps:
1) Click play on a voice seed.
Expected:
- Audio plays.

---

## D) Mixed list

### D1. Text + voice interleaving
Steps:
1) Create a normal text seed.
2) Create a voice seed.
Expected:
- Both appear in list, newest first.
- Text seed displays body text; voice seed shows transcript once ready.

---

## E) Regression

### E1. Autosave still works for text
Steps:
1) Type into text area and pause.
Expected:
- Autosave works (list updates).

---

## Deliverables
- Screenshot of voice seed in “Transcribing…” state.
- Screenshot of transcript displayed.
- Screenshot of audio playback control in list.

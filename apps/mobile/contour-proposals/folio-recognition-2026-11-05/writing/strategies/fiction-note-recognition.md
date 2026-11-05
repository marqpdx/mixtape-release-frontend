# Fiction note recognition — draft for Contour intake

2026-11-05 · Mobile · approved direction, draft contracts for Puddlejump/Blue review.

`writing.fiction_note_recognition` **0.1.0** is a separate Strategy beside
`writing.fiction_note_reading` 0.1.0. It does not change the latter or pretend to
provide its semantic reading. Character and Setting are the first review buckets;
Scene passage selection follows, and FI-10 still requires all three Shapes.

## Authoritative input and steps

The surface supplies immutable original sources/corrections, explicit Fiction,
Folio/type/title and source/context revisions/digests, the whole selected Contour
bundle, and this Folio's confirmed Dictionary entry revisions. No sponsor-wide
alias search, whole chat history or automatic learning replaces that context.

1. Deterministic preparation checks access, source readiness, policy, context and
   bounded whole dependencies. Do not infer the type or silently truncate material.
2. Deterministic cue recognition reports exact cue spans with negation/ambiguity.
   A cue is evidence, not a semantic verdict; absence does not prove absence.
3. One actual local model execution returns raw mention candidates with original
   code-point offsets and its pinned producer/score. This gets the only child
   execution ActionRun. The approved local Heddle/Switchboard/Inkwell seam must
   exist; setting a cloud flag false does not supply it.
4. Checked recognition validates raw output/identity/spans and preserves errors
   honestly. Raw NER candidates are not canonical Sightings or accepted Entities.

Core asks; Switchboard routes and gates; Inkwell executes local work and keeps no
records. All cloud AI is refused for a local-only Folio, transcription included,
before the automatic whisper selector can send material remotely. Local readiness
and host fit are external gates owned by Blue/CTO and BA2. No fallback is invented.

## Scope and presentation

If all recognition steps succeed, their execution states say succeeded, while
the public whole-reading status is **partial**, scope **recognition_only** and
semantic **not_run**. No imaginary semantic step is skipped/completed. A failed
step produces actual failure/partial and leaves dependent work unattempted; an
unavailable backend is not a successful empty extraction or Unplaced note.

The response separates source/context/plan identity, actual steps, raw candidates,
Dictionary suggestions and explicit human decisions. It claims no composed
orientation, attributes, Scene narrative or automatic placement. The writer-set
title stays untouched. Shape decisions may be supplied by the person without
another model call, using the approved person-origin contract after intake.

NER Eval's first run used three model labels. The two-bucket profile proposed
here needs its own pinned settings and verification; do not relabel those old
scores as measurements of this configuration. Unexpected/unsupported candidates
must be handled explicitly, not silently repaired into a permitted Shape.

## Folio Dictionary matching — outside Heddle's execution steps

Folio's deterministic resolution seam matches only names explicitly confirmed in
this Folio. `folio_dictionary.nfc_casefold.v1` compares
**NFC(casefold(NFC(value)))**. Stored main names/variants and the transcript remain
exactly as typed/transcribed. This is Unicode canonical equivalence and case
folding, not accent removal, transliteration, fuzzy matching or name identity.

Case folding and normalization can change code-point counts (Straße/STRASSE,
decomposed accents). Matching must retain alignment to original text and return
its exact offsets/quote; normalized-string offsets cannot be used directly. Do
not match a fragment of a normalization unit or invent a quote. Multiple entry
matches are alternatives, not an automatic merge. Deduplicate equivalent hits
within one entry without changing its stored spellings. Pin the implementation
and Unicode database version alongside the rule for reproducibility.

Matches carry entry id/revision and rule identity, separately from NER scores.
They do not confirm this occurrence, create a durable Sighting or mutate a record.
If a canonical Dictionary-origin Sighting is later materialized, the surface must
validate the exact source and immutable entry revision with no invented confidence.

## Human action and Dictionary curation

Drag/tap is preview; **Confirm and remember** is one explicit atomic command.
Human assignments use person provenance (actor/operation/server time) without
confidence. They do not rewrite model output, reuse a model's score or create a
fake model execution. **Leave out** is occurrence-only; Unsure is not a forced
backlog. Explicit keep and Entity linking remain distinct reviewed operations.

Dictionary names belong to the Folio; sponsor Entity aliases change only by a
separate explicit action. Add/rename/edit/remove share the phone/Workbench API.
**Only same-Entity Dictionary merges are allowed**. Cross-Entity merge is refused;
the writer can explicitly move names by hand and remove the unwanted entry, with
reviewed context/replay semantics. Never merge global Entity identity or rewrite
previous decisions. Entry revisions retain exactly what an earlier match meant.

## Acceptance and boundaries

Test exact NFC/decomposed/non-BMP source spans, case-fold expansion, name collisions,
other-Folio exclusion, generic editor/research/quoted-cue traps, manual missed-span
assignment, duplicate/reordered commands, stale callbacks, Dictionary rename/remove
history, same-Entity versus cross-Entity merges, local policy before transcription,
and unavailable/failing local execution. Wrong source/context or bad spans must
fail rather than be normalized into apparently correct evidence.

No production host, model profile or private trial is approved by these files.
Contour placement/versioning, bundle reference resolution and Blue's shared API
review precede consumer regeneration and phone implementation. Retain all used
old Shape/Strategy versions. No schema lookup may fall back to the internet.

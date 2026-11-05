# Folio recognition Contour intake drafts

2026-11-05 · Mobile · **draft files in the agent's own tree, not canonical Contour**.
Answers step 1 of `zz/handoff-2026-11-05-mobile-folio-contract-decided-next.md`.
Puddlejump alone places/versions these after review with Blue. No runtime schema,
API, database, release bundle, dependency or phone build changes in this unit.

## Proposed canonical placement

- shared/sighting_provenance.schema.json — SightingProvenance 0.1.0, three origins.
- shared/dictionary_entry.schema.json — neutral person-confirmed entry value 0.1.0.
- writing/character-0.2.0.schema.json — new Character schema, 0.1.0 untouched.
- writing/setting-0.2.0.schema.json — new Setting schema, 0.1.0 untouched.
- writing/strategies/fiction-note-recognition.strategy.yaml and prose — distinct
  writing.fiction_note_recognition 0.1.0, beside composed reading 0.1.0.

Versioned URN $ids are proposals to keep reference resolution unambiguous; review
against the registry's conventions. Puddlejump owns final paths/manifest entries
and any companion shape.yaml/generator changes needed to retain both versions.
DRAFT_SOURCES.json records hashes of the canonical 0.1.0 schema inputs used here.
Neither old source was changed. All existing Shape fields/bounds remain, except
shape_version and the approved provenance/conditional confidence addition.

## Validation and service responsibilities

Model origin requires high/medium/low top-level confidence. Person/Dictionary
origin prohibits that field, including null. Raw NER scores stay outside canonical
Sightings. Unknown fields fail. Explicit FormatChecker/format assertion is needed
for UUID and date-time; person timestamps are UTC. The draft check initially
found that this environment's FormatChecker silently lacked date-time support
without an optional dependency. Its explicit checker now rejects impossible
dates. Blue must ensure the real validator enforces formats rather than assuming
that constructing FormatChecker is sufficient. Provenance identifiers are
server-bound evidence, never accepted at face value from a client/model.

The Dictionary value intentionally omits Folio, Entity, lifecycle and permission
fields: those are the storage/API wrapper's responsibility. Entry changes are
person-origin only in this slice. JSON Schema enforces exact unique variants;
main not repeated among variants is an additional service check. The service also
checks Shape/version availability for the chosen Folio type, immutable referenced
revisions, actor authority and sponsor scope. No globally unique human name.

Shared $refs must resolve from the pinned local bundle/resource map only. Blue
must review resolver support, with Puddlejump's bundle/generator changes, before
any consumer regeneration. Never let a standard validator fetch missing resources
from HTTP. Old schemas remain available at their original version.

## Matching and bounds

Approved matching direction: NFC and case-folding with unchanged stored spelling.
This draft names the proposed rule `folio_dictionary.nfc_casefold.v1` and fixes
its order as NFC(casefold(NFC(value))). Core must preserve original offset alignment
through normalization/case expansion, return alternatives for collisions and pin
the Unicode implementation/version. It must not silently strip accents or trim
stored text. These are matching rules, not a new global alias vocabulary.

Only same-Entity Dictionary merges are allowed. Cross-Entity merges are refused.
A recognition-only successful Strategy is publicly partial, recognition_only,
semantic not_run; actual step states remain truthful. Scene remains the next slice.

`check_drafts.py` validates these proposed JSON schemas offline, resolves local
URNs with an explicit registry, exercises positive/negative provenance cases and
verifies the canonical input hashes. It does not test a production integration.
Use the existing core environment's jsonschema package; no install is required.

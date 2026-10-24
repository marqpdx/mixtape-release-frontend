> Update, 2026-10-23: the CTO decisions are now recorded in ADR-0060 and
> Heddle ADR-0061. The Writing shelf exists; Setting synonyms include both
> **locale and location**. This comparison remains reconnaissance history,
> not the service contract. Current client design:
> [Folio first slice](FOLIO_FIRST_SLICE_CLIENT_DESIGN.md).

# IP-0: Folio comparison and mobile handoff to Blue

2026-10-23. Working reconnaissance for the CTO-approved crossover plan,
`puddlejump/zz/intelligent-parsing-service-crossover-plan.md`.
This is Mobile's contribution to IP-0, not a settled shared contract or a second pipeline.

## What to extract, and what to keep surface-specific

| Concern | Shuttle implementation inspected | Folio requirement | Proposed boundary |
| --- | --- | --- | --- |
| Source preparation | `shuttle/interpretation/contract.py`: deterministic source digest and exact Unicode code-point spans | Preserve the note and transcript; bind every Sighting to immutable source/revision | Shared digest/span utilities and source envelope; Folio owns source loading and access |
| Ownership | `lifecycle.owned_parent`: initiator-authorized `shuttle.weave` envelope | Writer-owned Folio/note, preserving confirmed project context | Shared ownership checks with consumer hooks; do not copy Shuttle tool-name assumptions |
| Runtime and approval | `lifecycle.person_runtime`, `execute`; cloud worker rechecks person/runtime and bound approval | Same person runtime, visible missing/not-ready states, consent before each permitted execution | Shared runtime/approval/execution lifecycle; Switchboard/SW-9 routes and gates |
| Revision and correction | `begin`, `correct`, `execute`, `apply_interpretation`: expected revision, digest, latest child, stale rejection | Corrections and confirmed context can invalidate previous findings | Shared revision/result-application guards; context version must participate in execution identity |
| Orientation | Shuttle weave reading is part of its model findings | First turn proposes Fiction/title; only writer confirmation makes them authoritative | Folio-specific orientation unit and confirmation API on shared infrastructure |
| Cue and mention recognition | Shuttle `mention_extraction` and typed thing/place Sightings | Character, Setting, Scene; locale and location are Setting cues in Fiction; preserve ambiguous ordinary usage | Consumer-specific Shape bundle and unit contract; later swap a measured local adapter |
| Story and scene | Shuttle exact story passage plus firsthand/heard/remembered basis | Scene is mostly verbatim narrative with sourced references; Character/Setting usually name-centred | Reuse span/provenance checks; consumer-specific schema and semantic checks |
| Resolution | Findings initially unresolved; `placement.resolve_findings` and matcher supply candidates | Reuse confirmed Storyboard Entities and aliases; do not create Entities automatically | Resolution adapter seam; domain-specific repositories and explicit confirmation |
| Connections and reconciliation | Shuttle adjacency intention/evidence, typed references and weave coverage | Reconcile mentions with confirmed Folio context/Entities, preserving uncertainty | Shared reference validation primitives; consumer-specific interpretation rules |
| Assembly and results | `apply_interpretation` validates before storing provisional findings | Deterministically aggregate bounded step results and honest partial/failure states | Shared execution metadata; Folio response assembler; do not imply success for unexecuted steps |
| Completion | Shuttle holds packet, then explicit Publish or Keep in Notebook | Folio is a raw-to-coherent working project, not a Commons publication session | Keep Shuttle envelope/publication/abandonment and Folio project confirmation separate |

## Critical distinction: named units are not yet separately executed steps

Shuttle's `contract.UNITS` names source_preparation, mention_extraction,
story_attribution, entity_resolution, connection_interpretation, clarification.
The inspected cloud worker makes **one** `run_blocking` call for the complete
model findings and then stamps each named unit with the contract version.
That records vocabulary/version, not evidence of six independent executions.

Folio's proposed steps are source preparation, orientation, cue/mention
recognition, Shape/attribute interpretation, reconciliation and response assembly.
These are comparisons for IP-0, not registrations. The shared service must be
able to distinguish deterministic work, actual model executions, skipped units,
failed units and units not attempted. Only actual execution children should be
reported as model calls. Do not multiply accounting records merely to match
labels. IP-4 settles versioned unit contracts, including the local adapter seam.

## Context, schema and authority needed from IP-0 / IP-2

- A bounded, versioned context snapshot: confirmed Folio type/title, relevant
  confirmed Entities, and the Contour Shape/synonym bundle and digest. Nine Shapes
  and 38 synonyms were illustrative counts, never a factual inventory or target.
- Three initial Fiction Shapes: Character, Setting, Scene; locale as a Setting
  synonym; optional `representation_character`. Puddlejump owns their intake.
- Whether and how a changed context invalidates an in-flight execution. Binding
  only source text is insufficient when the confirmed context changes.
- Consumer-specific schema/semantic validators on common source/span/provenance
  primitives. No hard-coded `shuttle.*` references in the shared validator.
- Writer confirmation is an API action; the model cannot mark context/title,
  Sightings or Entities confirmed. Clients render service states, never route models.
- Keep SW-9 verification distinct from extraction. Existing checks in the cloud
  worker are useful evidence, not proof that every dispatch path has passed IP-1.

Catalyst's `reference/contour/pipeline.md` is a **draft** comparison precedent:
source recognition → human text review → Shape selection → governed shaping →
validation → explicit Accept. It reinforces provisional Sightings and human
promotion; it does not make Folio's voice capture OCR or authorize migrating
Catalyst in this slice.

## Immediate SH-11 observations for Blue

The real build-packet, confirm and keep-in-notebook API routes exist. Current
mobile publication review remains the static example. Known stories are now in
`story_prompts[].known_story`; a live review should prefill them verbatim rather
than inventing or asking for them again. The October 22 status decisions resolve
Place/story, deliberate exclusions, Keep in Notebook and interrupted-session
recovery. OQ8 remains the mobile review design question; OQ14 is not produced by
today's Sightings; SH-10/map acceptance remains separate.

Recovery needs coordination before claiming complete live acceptance:

- The current detail endpoint permits pending or abandoned envelopes, but returns
  `weave_closed` for a successfully published envelope.
- Confirm returns a result and marks the envelope succeeded; a second confirm is
  rejected. It is not currently a replayable publication request.
- If publication commits but the phone loses the response, it cannot use this
  detail endpoint to distinguish that success from a closed/failed publication.
  Do not automatically retry confirm or tell the person nothing was published.
- Blue should define an authorized terminal-result lookup or idempotent replay
  contract for this case. Mobile then persists one active weave identity and can
  restore the real result without creating a queue or duplicate publication.

## Work ownership and next steps

Blue: lead shared Core extraction, IP-1 verification, IP-2 regression checks and
shared/terminal-result contracts. Mobile: contribute this IP-0 comparison, design
SH-11 review with explicit Publish and Keep in Notebook, then wire the existing
endpoints; build Folio interpretation clients after IP-2. Puddlejump: ADR and
Contour. Folio slug work is separately approved and does not depend on the new
interpretation service. Benchmark servers remain deferred; offline NER requires
no paid server or production download.

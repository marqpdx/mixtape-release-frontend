# Folio first slice: client design for HD-5 / FI-9

2026-10-23. Design only; no new interpretation endpoints or models are assumed.
ADR-0060 is ratified. The ADR-0061 text inspected is marked proposed; its CTO
choices govern the preparation here, while Puddlejump owns ratification/status.
Build this client slice only after HD-2 and the shared contract are available.

## Create and orient

The existing New Folio title field gains a type chooser with Fiction as the only
offered type, explained as the available vocabulary. Require an explicit choice;
do not silently default an unknown or existing untyped Folio to Fiction. Existing
untyped Folios get one prompt above their capture: “What kind of work is this
Folio? Fiction is available now.” The exact placement/wording is a proposal for
ADR-0060 OQ5. Declining leaves capture available and interpretation unavailable.
A title remains optional; a writer-set title is never overwritten by a reading.

The first Interpret action shows the exact note, the chosen type, and the named
steps that will receive it through the person's Claude account. Its permission
is for this source/context revision and those steps, not reusable permission for
later notes, Entity creation or publication. A missing/not-ready runtime or policy
restriction is a visible unavailable state. There is no local-timeout fallback.

The orientation card reads, for example, “We're working in Fiction, in The Quiet
City,” with Confirm orientation and Correct. Confirmation stores orientation only;
it does not accept the adjacent Sightings. Choosing a different title/type later
is deliberate and creates a new context revision. Old readings remain visible
as superseded, not applied to the new context. No existing project is silently
backfilled as Fiction.

## Read many meanings in one note

Keep the unchanged note/transcript at the top, followed by a proposed reading
with individual cards for Character, Setting and Scene. A Character/Setting card
centres on its sourced name plus supplied attributes; a Scene card centres on
verbatim narrative plus sourced references. Missing attributes stay absent.
`representation_character` describes the Shape, not confidence or a ranking.

Use Contour's Writing shelf and flat Sighting envelope. No payload wrapper and
no Sighting status field. Confidence, source_locator and uncertain are visible;
confirmation belongs to Folio's own records. Tapping evidence highlights the
original source by Unicode code-point span; JavaScript must convert offsets
correctly for its UTF-16 strings. Never silently apply code-point offsets as JS
string indices. Source text remains the authority.

Setting cues include setting, **locale and location**. They are domain evidence,
not certainty: “the location of the file” is ambiguous/ordinary usage, not a
fictional Setting. Shape cues, confirmed Entity aliases and project markers have
separate labels. Fiction has **no bridge** to real Locations, Places or the map.

Keep the existing note-level Shape picker as a separate browse facet pending
ADR-0060 OQ4; do not silently derive or overwrite it from one of several Sightings.
A proposed match to an existing Storyboard Entity is separate from extraction;
only the writer's explicit linking action can create/change that association.
No automatic Entity, Participation or Storyboard placement is created.

## Ordered steps and honest states

Render Heddle's actual ordered reading steps, not a hard-coded number of AI calls:
source preparation, orientation, cue/mention recognition, Shape/attribute
interpretation, Folio Entity reconciliation and deterministic assembly are the
comparison vocabulary. The service's versioned contract determines the real list.

- Deterministic: identify it as local computation, not a model execution.
- Model pending/running: show queued/working without pretending progress is known.
- Complete: show the checked output with its source/context version.
- Failed: name the failed step; retain capture and any usable provisional outputs.
- Partial: show completed outputs and the failed/missing steps together.
- Skipped/not attempted: say so; never imply these steps succeeded.
- Superseded: retain the prior reading; explain that source/context changed.

Client errors never become Unplaced. Never automatically retry interpretation,
change backend, or resend cloud data. Use the contract's idempotency key when a
person explicitly retries. Only real model executions have child ActionRuns.
Surface confirmation and Heddle run/step state are different things.

## Contract inputs required from Blue before implementation

A shared response for mobile and Workbench: source and context identity, ordered
step records and their real states, reading/step provenance, unresolved flat
Sightings, context/title proposal, and the surface's confirmation operations.
Specify idempotency/retry semantics and stale-context errors. Folio's Entity
matcher plugs into Heddle's resolution seam; Heddle stops at unresolved Sightings.
Confirm how Contour is loaded in production before relying on runtime vocabulary.
Folio's Strategy id/version is ADR-0060 OQ2, not a client invention.

## Acceptance for phone and Workbench

One Fiction note can yield Character, Setting and Scene while its words remain
unchanged. Locale and location work as cues without turning ordinary file-location
language into a Setting. Confirming the orientation does not confirm Sightings.
A corrected context supersedes old results, including a late in-flight completion.
Missing runtime and forbidden cloud processing send nothing. A partial/failed
reading stays visibly partial/failed. Existing title and writer-confirmed browse
Shape remain under the writer's control. Source highlighting survives emoji and
non-BMP characters. No real-world map links or automatic Entity creation occur.

Use synthetic contrasts first. The CTO's real note is used only with their
permission. HD-2, the settled shared contract and Core orientation models precede
client implementation; this document adds no speculative fields to packages/api.

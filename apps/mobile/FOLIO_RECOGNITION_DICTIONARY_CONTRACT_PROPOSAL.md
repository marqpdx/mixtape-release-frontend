# Folio recognition and Dictionary — contract proposal

2026-11-04 · Mobile Agent · **Proposal only; no executable API/schema or migration**

Implements the bounded drafting request in Puddlejump
`zz/handoff-2026-11-04-mobile-folio-recognition-reconciliation.md`, approved in
`289d1be`. Puddlejump reviews this with Blue before any schema/API implementation.
The CTO's six forks and Folio-owned, hand-editable Dictionary are decided;
field names, versions, storage details and interface contracts below are proposals.

> **2026-11-05 intake decision:** Puddlejump's approved next-step handoff supersedes
> the pending choices below: shared definitions go on `shared/`; recognition is
> `writing.fiction_note_recognition` 0.1.0, separate from composed reading;
> cross-Entity Dictionary merges are refused; the proposed partial status mapping
> is accepted. Matching explicitly specifies NFC/case-folding with stored spelling
> unchanged. Intake drafts are in `contour-proposals/folio-recognition-2026-11-05/`.
> Blue owns backend/schema/API review; these files authorize no implementation.

## 1. Scope and delivery

The first return is recognition the writer can shape: **Character and Setting**.
Scene passage selection follows in the next slice; FI-10's three-Shape acceptance
is unchanged. No composed narrative, publication or Storyboard placement is implied.

The Dictionary belongs to a Folio. Entity identity remains sponsor-owned. A
confirmed name in this Dictionary does not become a sponsor Entity alias or
another Folio's recognition vocabulary without explicit separate action.

Reuse Folio capture, Heddle's sources/steps/history, Contour, storyboard.Entity,
FolioSightingDecision and keep_sighting. Add no second interpretation pipeline,
Entity universe or model call merely to record human knowledge. No guessed
confidence, automatic acceptance or implicit cloud fallback.

## 2. Contour proposal A: truthful Sighting provenance

Puddlejump owns canonical placement/version assignment. Proposed shared definition:
`SightingProvenance` 0.1.0, referenced by new Writing Shape versions, proposed
**0.2.0**. Keep every used 0.1.0 schema available and unchanged. Do not require
Shuttle's existing findings or other callers to change in this slice.

Keep Sightings flat. Add `provenance` as a discriminated object; keep `confidence`
at top level **only for model-origin Sightings**. No status or payload wrapper.
Core supplies trustworthy provenance; model responses cannot choose actor, operation,
Dictionary identity or another model's provenance.

| kind | Required provenance members | confidence |
| --- | --- | --- |
| model | kind, model_id, model_revision, execution_action_run_id | Required at top level: high, medium or low |
| person | kind, actor_id, operation_id, recorded_at | Absent, not null and not fabricated |
| dictionary | kind, entry_id, entry_revision | Absent; a confirmed referent match is not a model confidence |

IDs are UUIDs except model_id/model_revision (nonempty pinned identifiers).
recorded_at is server-produced UTC date-time. Unknown properties fail validation.
Model revisions/child IDs are validated against actual execution records; actor
and operation are validated against the authenticated operation. Dictionary
provenance resolves the immutable entry revision that supplied the match.

A compact schema composition for the provenance member:

```json
{
  "oneOf": [
    {"type":"object","additionalProperties":false,"required":["kind","model_id","model_revision","execution_action_run_id"],"properties":{"kind":{"const":"model"},"model_id":{"type":"string","minLength":1},"model_revision":{"type":"string","minLength":1},"execution_action_run_id":{"type":"string","format":"uuid"}}},
    {"type":"object","additionalProperties":false,"required":["kind","actor_id","operation_id","recorded_at"],"properties":{"kind":{"const":"person"},"actor_id":{"type":"string","format":"uuid"},"operation_id":{"type":"string","format":"uuid"},"recorded_at":{"type":"string","format":"date-time"}}},
    {"type":"object","additionalProperties":false,"required":["kind","entry_id","entry_revision"],"properties":{"kind":{"const":"dictionary"},"entry_id":{"type":"string","format":"uuid"},"entry_revision":{"type":"integer","minimum":1}}}
  ]
}
```

Each new Shape also needs a conditional schema: model requires confidence;
person/dictionary prohibit it. The old unconditional confidence requirement must
not remain inherited. Enforce UUID/date-time formats explicitly; annotations
alone in JSON Schema do not enforce them. Preserve exact source locators and
Shape-specific requirements. This is a drafting fragment, not a consumer copy.

**NER output stays recognition evidence.** Its numeric score remains an
uncalibrated score on the raw candidate. It does not automatically become a
high/medium/low Sighting. A person who assigns a raw span produces a person-origin
Sighting. A Dictionary suggestion does not imply the person accepted this occurrence.
Dictionary-origin Sightings, if materialized, still need a reviewed occurrence
and exact source locator; a mere match must not create durable content.

## 3. Contour proposal B: Dictionary entry value

Proposed neutral definition `DictionaryEntry` 0.1.0, not a new Fiction Shape and
not a database model definition. Puddlejump chooses its canonical shelf/path.

| Field | Constraint |
| --- | --- |
| entry_id | Stable UUID |
| revision | Positive integer |
| shape_id, shape_version | Known Shape and exact version allowed by this Folio type |
| names | Object: main nonblank string; variants array of distinct nonblank strings |
| note | Optional writer-owned string |
| provenance | For this slice, person provenance from section 2 |

Proposed initial bounds: main/each variant 255 characters, at most 32 variants,
note 2,000 characters. Exact user spelling/Unicode is preserved. Reject empty or
exact duplicate variants and a variant equal to main; no silent normalization.
A separately versioned matching rule may compare case-insensitively, but never
rewrites stored names or equates two referents solely by spelling.

The storage/API wrapper adds Folio, sponsor-authorized Entity and lifecycle
metadata. Contour defines the value, not whether an Entity is created or how
permissions, requests and history are stored. Future types choose their own
Shapes; ingredient/preparation/dose must require no Fiction-specific mechanism.
Initially, only Character/Setting are offered and Dictionary mutations are human.
Imported or model-created entries are not silently enabled by a broad union type.

## 4. Recognition Strategy and honest scope

Propose `writing.fiction_note_reading` **0.2.0**, recognition scope, alongside the
existing 0.1.0 composed-reading Strategy. Puddlejump confirms the version/id choice.
No silent replacement of an existing reading's plan or reuse of its approval.

| Step | Kind | Result |
| --- | --- | --- |
| source_context_preparation | deterministic | Ready immutable sources, local policy, context/Dictionary revision, selected whole bundle |
| cue_recognition | deterministic | Exact cue spans and qualifications; not proof of meaning |
| mention_recognition | local model | Raw bounded candidates, scores, producer and exact offsets |
| checked_recognition | deterministic | Checked candidate identities/offsets; no fabricated semantic output |

Only mention_recognition gets an execution child ActionRun. Dictionary matching
runs through Folio's existing post-Heddle resolution seam, deterministically and
separately identified; it creates no Entity, Participation or accepted decision.

No semantic/composed-reading step is declared and falsely marked succeeded or
skipped. A successful recognition Strategy has successful actual step records,
but the **public whole-reading status is partial**, with scope=recognition_only
and semantic_interpretation=not_run. Distinguish Strategy execution success from
whole-reading coverage rather than altering the meaning of every Heddle success.
On failure, public status is failed/partial as appropriate, never Unplaced.
Puddlejump/Blue should approve this surface adapter of Heddle's status explicitly.

The current Heddle ordered dispatcher rejects local execution as unavailable;
a new approved local backend seam is required. A configuration flag alone does
not make it work. Core asks; Switchboard routes/gates; Inkwell executes local
work and keeps no records. No routing logic is put on the phone.

Proposed response sections: reading_id/action_run_id; source/context/plan identity;
status/scope; actual steps; raw recognition candidates; separately labelled
Dictionary matches; human decisions. Canonical Sightings and raw NER candidates
remain distinct sections. No invented orientation, attributes or Scene narrative.
The existing whole-bundle/source budgets remain explicit; no silent truncation.

## 5. Human assignment: extend FolioSightingDecision

Keep the existing dispositions dismiss/defer/link_entity. **No new decision table**
and no proposed/unaccepted rows masquerading as decisions. Extend the record:

| Field | Proposed meaning |
| --- | --- |
| origin_kind | checked_finding, recognition_candidate or manual_span |
| attempt_id, sighting_id | Nullable as a pair; required only for checked_finding |
| recognition_attempt_id, recognition_candidate_id | Optional exact retained raw candidate occurrence; required for recognition_candidate |
| selected_span | Exact source_ref/source_revision/start/end/quote object for raw/manual assignment |
| source_digest, source_revision | Authoritative reviewed source chain identity |
| shape_id, shape_version | Explicit chosen role/version for defer/link; absent on an untyped dismiss |
| authored_sighting | Validated person-origin canonical Sighting for raw/manual defer/link; not a rewritten model finding |
| dictionary_entry | Optional protected reference when link/remember adds or links a Dictionary entry |

Retain interpretation parent, actor, operation/request id, request digest, time,
original/reviewed context and explicit reaffirmation evidence already built.
For raw/manual spans the original source is captured by a reusable interpretation
parent even if no model runs. Dictionary editing without a note uses its own
human command, not a fake reading or execution child.

Constraints and service rules:

- checked_finding uses the current lookup against retained checked output.
  raw/manual paths cannot bypass that lookup by pretending to be checked findings.
- Raw/manual source spans are validated against the immutable authoritative text;
  offsets use Unicode code points and exact quote. A selected boundary is an
  annotation; a transcript correction uses Heddle's append-only correction service.
- A candidate pointer is evidence, not authority for the selected Shape. Core
  verifies its source/attempt; the writer may choose a different role/boundary.
- Person Sightings are kept on the decision record as human-authored annotations,
  outside model findings. Never patch model output or manufacture a semantic run.
- For the first drag/tap UI, drop is a preview. **Confirm and remember** explicitly
  links/creates the selected Entity and Folio Dictionary entry in one transaction.
  A transient bucket move creates neither. **Leave out** records occurrence-only
  dismiss. Unsure remains unresolved, not a forced provisional backlog.
- Explicit keep without Dictionary membership can use defer/keep_sighting after
  person-origin canonical validation; it is not the automatic effect of dragging.
- For link_entity, the target Entity must share the Folio sponsor and match the
  allowed role. Choosing a new name explicitly creates it. Never mutate another
  project's Entity kind/name/aliases to make the target fit.
- Preserve database disposition/target checks. Replace the old unconditional
  attempt/sighting uniqueness with conditional checked-occurrence uniqueness;
  add origin-appropriate occurrence constraints after Blue's schema review.
- The same operation ID/digest replays its receipt; another payload conflicts.
  Row locks and unique constraints prevent duplicate decision/keep/Entity/entry.
  New raw/manual operations use a stable selection id or operation id rather
  than deduplicating solely by words: repeated same-spelling mentions can differ.

Exact nullable constraints, authored-value storage and migration backfill must
be reviewed before implementation. Existing rows remain checked_finding with
unchanged model provenance and existing IDs, not rewritten person assertions.

## 6. Durable Folio Dictionary: proposed records and commands

Recommend a FolioDictionaryEntry membership record over the existing Entity:
UUID; protected Folio/Entity; Shape id/version; current revision; canonical names
and note; lifecycle active/removed/merged; optional merged_into; creator/timestamps.
No platform-global name uniqueness. Proposed active uniqueness is (Folio, Entity,
Shape); equal spellings can still denote different Entities and yield a choice.
All targets are sponsor-authorized on every command/read, not just creation.

For exact historical Dictionary provenance, recommend immutable entry revisions:
entry id/revision, canonical value, operation/actor/time and lifecycle event.
A later rename/merge/remove must not change what a previous Dictionary match meant.
Historical entry-revision references remain resolvable and access controlled.

Idempotency needs a Folio-scoped operation receipt: actor, operation id, digest,
result, timestamp. Prefer existing suitable command machinery if Blue identifies
it; otherwise propose a small Dictionary command record rather than an ever-growing
JSON field with a lifetime editing limit. This is command/audit infrastructure,
not another candidate or decision system. Entry/revision/receipt tables are a
storage recommendation, not permission to create them now.

All mutations lock Folio then affected entries in stable ID order, validate
expected context/entry revisions, and atomically write revisions/receipt plus the
new Dictionary/context identity. GET is read-only. Race/stale input gives 409;
replay returns the original receipt and does not reapply it under a newer context.

| Writer command | Effect and important boundary |
| --- | --- |
| Add | Choose Shape and existing Entity or explicitly create one; set main/variants/note; no global alias write |
| Rename / edit variants / note | Update this entry only; preserve old value in history; an Entity-wide alias/name edit is separate and not offered implicitly |
| Merge | Preview both entries; explicit target, names and note; atomically retire source toward target and revise target; Dictionary merge only, not global Entity merge |
| Remove | Stop future Dictionary matching; retain tombstone/history, Entity and previous decisions |

Merge is same-Folio and same-Shape in this slice, with both expected revisions.
It must not rewrite historical note decisions or cross-Folio Entity identity.
Where source/target refer to different Entities, the user must see that the
operation unifies **this Folio's future recognition**, not sponsor-wide identity.
Blue/Puddlejump should approve or narrow this case; reject it visibly until its
semantics are implemented. No silent destructive global merge.

Changing Dictionary knowledge advances semantic context. A rename/variant edit
triggers no automatic re-reading. A new note uses a bounded snapshot of this
Dictionary, never a sponsor-wide name lookup or unchecked global Entity aliases.
Initial matching proposes exact/case-folded name occurrences with an explicit
rule version and entry revision. If multiple entries match, return alternatives;
no score threshold silently confirms a referent. Dictionary suggestions remain
suggestions for each occurrence, even when their project referent is confirmed.

## 7. Shared API proposal, phone and Workbench

Relative to /api/folio/folios/{folio_id}, no trailing slash:

| Route | Purpose |
| --- | --- |
| GET /dictionary | Authorized current entries and Dictionary/context revisions |
| POST /dictionary | Explicit add with operation id, expected context, Shape, names/note and existing/new Entity choice |
| GET /dictionary/{entry_id} | Current entry and authorized revision references |
| PATCH /dictionary/{entry_id} | Main/variants/note; operation id and expected entry/context revisions |
| POST /dictionary/{entry_id}/remove | Explicit reversible-in-history retirement, not deletion |
| POST /dictionary/{entry_id}/merge | Target entry, both expected revisions, reviewed resulting names/note and operation id |
| POST /notes/{note_id}/readings | Begin/reuse recognition parent; explicit selected Strategy/context |
| POST /notes/{note_id}/readings/{reading_id}/recognize | Approve displayed local work and exact source/context/plan; no cloud step |
| GET /notes/{note_id}/readings/{reading_id} | Actual stages, candidates, Dictionary suggestions and decisions |
| POST /notes/{note_id}/readings/{reading_id}/decisions | Origin-specific explicit dismiss/defer/link command including selected span and optional remember instruction |

Bodies never carry authoritative actor, sponsor or model provenance from the
client. Requests bind operation id + expected identity + exact intended mutation.
Responses return operation receipt plus relevant resulting revisions; a replay
receipt is not proof that its historical context is still current. 404 for
inaccessible targets; 409 for stale/conflicting replay; 422 for unsupported Shape,
invalid target/span/merge; 413 for explicit budgets; unavailable/denied local policy
is visible, never an empty successful reading.

The exact API request/response schema is reviewed with Blue before adding shared
client types. We edit only clients/folio/ and announce shared hook/barrel changes.
Manual page editing and drag confirmation call the same Dictionary command service.
A drag confirm that writes a decision and entry is one atomic command, not two
independent client requests that can leave half the intended outcome.

## 8. What people see

**Capture/review, phone:** unchanged transcript near the top; clearly named Folio
and type; local-only indicator where applicable; highlighted spans and accessible
chips; Character/Setting buckets; tap menu as well as drag; selectable missed text.
Show a concise preview before Confirm and remember. Avoid developer concepts such
as ActionRuns, source digests or schema versions in the product interaction.

| Visible state | Meaning / available action |
| --- | --- |
| Transcribing | Actual capture processing; not recognition or inference |
| Recognising locally | Real model execution; safe capture remains available |
| Recognised | Raw provisional suggestion; choose role, adjust selection or leave out |
| Known in this Folio | Dictionary suggestion with referent name; confirm this occurrence or choose another |
| Assigned by you | Explicit persisted human choice; distinguish from original model proposal |
| Unsure | Unresolved; may leave it; not failed and not forced into a task queue |
| Left out | Occurrence-only dismiss; accessible when reviewing that note, no permanent negative rule |
| Unavailable / failed / partial | Actual cause and retained work; no cloud fallback, no Unplaced substitution |

**Dictionary page, phone and Workbench:** list entries by permitted Shape, main
name and variants; view/edit note and provenance; add by hand without capture;
rename/edit variants; review a merge; remove with clear scope. Show that edits
apply to this Folio. Workbench can have denser list editing, but authority and
command semantics are identical. Same-spelling conflicts offer choices rather
than hidden suffixes on human names. Neither page displays a model confidence as
human certainty or claims the weights are learning as this list grows.

## 9. Privacy and host gates

Local-only Folio means **all cloud AI refused, transcription included**. Blue /
Switchboard owns policy propagation and SW-9 gating before any remote AI send;
Core must guard capture dispatch before whisper's automatic selector can escape
that requirement. Shared capture UI does not establish local transcription.

BA2 owns actual local execution fit on the selected host. Cass's earlier ~950 MiB
cannot simply be assumed to hold the measured ~1.5 GiB GLiNER process. Host choice,
resource readiness and production trial approval precede any author-local trial.
The laptop result is evidence, not permission to install models on a server.
Mobile owns the UI; the CTO runs the trial after synthetic Jackalope acceptance.
No direct phone-to-model route, no hidden Claude call and no silent retry.

## 10. Acceptance-to-test map

| Case | Required verification |
| --- | --- |
| Jackalope capture | Exact original transcript/audio retained; recognition scope visibly partial; only supported initial buckets |
| Missed Mary selected manually | Exact code-point span validated; person provenance, no confidence/model child invented |
| desert southwest confirmed | Folio Entry/Entity/decision effects match the explicit command; locale remains a Contour cue |
| Later Mary | Dictionary suggestion with entry revision; confirmation needed; no duplicate Entity from a replay |
| Another Folio's Mary | No automatic membership, names or variants leaked across Folios |
| Same spelling, two referents | Alternatives remain visible; no automatic merge |
| Julia/research train stations/quoted scene | Explicit occurrence dismissal changes no global negative vocabulary |
| Entry rename/variant edit | This Folio changes, shared Entity aliases/other Folios do not; context advances with no automatic reading |
| Dictionary remove/merge | Old references resolve original revisions; notes/Entities/history remain intact; same-sponsor/Shape constraints hold |
| Repeat/competing commands | One recorded effect; conflicting payload or stale revisions rejected; no orphan entry/Entity/keep after rollback |
| Changed source/context | Late output never applies over human edits; conscious old-context decision records both contexts |
| Offline/local-only denial | Neither remote transcriber nor Claude receives content; unavailable/failed stated plainly |
| Manual page / drag | Both invoke the same command and permission semantics |
| Scene later | Verbatim passage, person provenance, no invented narrative or automatic Storyboard placement |

## 11. Review requested before implementation

1. Puddlejump places/versions the provenance and Dictionary value definitions,
   reviews conditional confidence and old-version compatibility with Blue.
2. Approve/narrow origin-specific decision fields, human-authored value storage,
   Dictionary revisions/receipts and scoped merge semantics before a migration.
3. Approve recognition Strategy identity and partial-coverage presentation, then
   coordinate the required local Heddle/Switchboard execution seam with Blue.
4. Confirm first phone/Workbench Dictionary surface and shared API; return any
   unresolved fork instead of treating this draft as a decision.
5. Keep the earlier gates: candidate-retirement data count, migration-before-deploy,
   local transcription/policy enforcement and BA2 fit. M2/M3 stay partial; FI-10
   still requires the full live three-Shape goal. Shuttle trial remains separate.

No Contour, API, schema, model field, migration, dependency, setting or phone build
is changed by this proposal. No production model or private data is accessed.

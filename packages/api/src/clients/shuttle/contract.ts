// Shuttle packet contract (ADR-0058, Appendix A, SH-7a).
//
// Mirrors mixtape-release-core/app/shuttle/contract/schema/*.schema.json exactly.
// No endpoint yet — the mobile agent (apps/mobile) builds SH-11 against these
// types and the fixtures in ./fixtures, then wires to real calls once SH-7b
// and SH-8 land. Keep this file and the schemas in lockstep: a change here
// goes to the CTO first (handoff Appendix A, "After the branch point").

// These are the real value sets (use them when constructing a payload in
// code, e.g. SH-7b or the mobile UI). The interfaces below type the
// corresponding fields as `string`, not these literal unions: fixtures are
// imported as JSON modules, which TypeScript always widens to `string`, so a
// literal-union field would never actually type-check against real JSON and
// would be a false sense of safety. The literal values are enforced where it
// matters, server-side, by the `enum`/`const` keywords in the JSON Schemas.
export type ShuttleClient = "phone" | "desktop"
export type ShuttleCaptureMode = "typed" | "voice"
export type ShuttleMatchState = "found" | "new" | "near_duplicate"
export type ShuttleItemKind = "place" | "thing"
export type ShuttleMergeDecision = "merge" | "keep_separate"

export interface ShuttleCandidate {
  id: string
  name: string
  score: number
}

// version is typed as `string`, not the literal "1.0": fixtures are imported
// as JSON modules, which TypeScript always widens to `string`. The literal
// value is enforced on the core side (jsonschema `const` on the schema).
export interface ShuttleWeaveIn {
  version: string
  text: string
  client: string
  capture_mode: string
}

export interface ShuttlePacketItem {
  item_id: string
  kind: string
  name: string
  locale: string
  match_state: string
  /** Present when match_state is "near_duplicate". */
  candidate?: ShuttleCandidate
}

export interface ShuttleIdea {
  idea_id: string
  wording: string
  closest_existing: ShuttleCandidate[]
}

export interface ShuttleAdjacency {
  adjacency_id: string
  /** Exactly two item_ids (enforced server-side; JSON-array typing can't express tuple arity here). */
  ends: string[]
  reason: string
}

export interface ShuttleStoryPrompt {
  item_id: string
  prompt: string
}

export interface ShuttleStoriesNotYetTold {
  question: string
  offers: Array<{ id: string; label: string }>
}

export interface ShuttlePacketOut {
  version: string
  action_run_id: string
  anchor: {
    headline: string
    counts: {
      places: number
      ideas: number
      adjacencies: number
    }
  }
  items: ShuttlePacketItem[]
  ideas: ShuttleIdea[]
  adjacencies: ShuttleAdjacency[]
  story_prompts: ShuttleStoryPrompt[]
  /** At most three offers, as one question. Absent when there are none to offer. */
  stories_not_yet_told?: ShuttleStoriesNotYetTold
}

export interface ShuttleConfirmStory {
  item_id: string
  text: string
  music_link?: string
}

export interface ShuttleMergeAnswer {
  item_id: string
  candidate_id: string
  decision: string
}

export interface ShuttleIdeaRewording {
  idea_id: string
  wording: string
}

export interface ShuttleConfirmIn {
  version: string
  action_run_id: string
  /** Item ids the person approved. Anything left out rests as a Seed. */
  ticked_item_ids: string[]
  stories: ShuttleConfirmStory[]
  merge_answers?: ShuttleMergeAnswer[]
  /** Absent when the packet offered no Stories Not Yet Told. */
  stories_not_yet_told_answer?: boolean
  idea_rewordings?: ShuttleIdeaRewording[]
}

export interface ShuttleWrittenRow {
  item_id: string
  written_as: string
  id: string
}

export interface ShuttleResultOut {
  version: string
  action_run_id: string
  written: ShuttleWrittenRow[]
  rested_as_seed: string[]
}

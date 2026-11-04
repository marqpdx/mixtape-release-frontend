// atriumTypes.ts

export type DialogueStatus = "active" | "closed" | "archived";

export type AtriumDialMode = "expressive" | "very_focused" | "vague";

export type AtriumSSEEventType =
  | "turn"           // the reply has started: its entry id and which agent is answering
  | "delta"          // response text chunk
  | "final"          // the finished reply (content may differ from the streamed text when a document was unwrapped)
  | "activity"       // tool-call activity line (e.g. "Reading foo.md")
  | "context_status" // context window usage update
  | "ready"          // warm — nothing to warm since each turn starts its own process (ST-3 Part B)
  | "reconstructed"  // warm — older servers only
  | "fallback"       // older servers only
  | "compacted"      // /compact completed
  | "done"           // exchange complete
  | "error";         // the reply stopped: { code, detail, partial? }

export interface AtriumContextStatus {
  used: number;
  total: number;
  pct: number;
}

/** checkpoint = a compact: the Dialogue so far, summarized; later replies start from it. */
export type AtriumEntryType = "message" | "document" | "checkpoint";

/** The agents that can answer in a Dialogue; the person picks one per message. */
export type DialogueProvider = "anthropic-claude-code" | "openai-codex";

export const DIALOGUE_PROVIDERS: { value: DialogueProvider; label: string }[] = [
  { value: "anthropic-claude-code", label: "Claude" },
  { value: "openai-codex", label: "Codex" },
];

/** pending/streaming while the runtime worker writes a reply; failed carries error_code. */
export type DialogueEntryStatus = "pending" | "streaming" | "done" | "failed";

export interface DialogueEntry {
  id: string;
  role: "user" | "assistant";
  /** For replies: the provider that answered. Blank for the person. */
  speaker: DialogueProvider | "";
  content: string;
  entry_type: AtriumEntryType;
  document_title: string;
  status: DialogueEntryStatus;
  /** runtime_missing | runtime_not_ready | mode_not_allowed | failed */
  error_code: string;
  created_at: string;
}

export type DistillateDocumentType =
  | "field-note"
  | "finding"
  | "position-paper"
  | "draft-adr"
  | "summary"
  | "other";

export const DISTILLATE_DOCUMENT_TYPES: { value: DistillateDocumentType; label: string }[] = [
  { value: "summary", label: "Summary" },
  { value: "field-note", label: "Field Note" },
  { value: "finding", label: "Finding" },
  { value: "position-paper", label: "Position Paper" },
  { value: "draft-adr", label: "Draft ADR" },
  { value: "other", label: "Other" },
];

export interface Distillate {
  id: string;
  title: string;
  body: string;
  document_type: DistillateDocumentType;
  status: "pending" | "done" | "failed";
  error_code: string;
  /** Present when status is failed: what to do about it. */
  detail?: string;
  created_at: string;
}

export interface Dialogue {
  id: string;
  title: string;
  session_context: string;
  dial_mode: AtriumDialMode;
  /** The agent that answers next unless the person picks another. */
  ai_provider: DialogueProvider;
  sponsor_type: string | null;
  sponsor_slug: string | null;
  initiative_id: string | null;
  initiative_title: string | null;
  status: DialogueStatus;
  last_activity_at: string | null;
  entry_count: number;
  created_at: string;
  updated_at: string;
}

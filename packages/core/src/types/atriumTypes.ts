// atriumTypes.ts

export type AtriumSessionStatus = "active" | "closed" | "archived";

export type AtriumDialMode = "expressive" | "very_focused" | "vague";

export type AtriumSSEEventType =
  | "delta"          // response text chunk
  | "activity"       // tool-call activity line (e.g. "Reading foo.md")
  | "context_status" // context window usage update
  | "ready"          // warm — subprocess was already live, same context
  | "reconstructed"  // warm — cold spawn; history injected from ApertureLog + DB entries
  | "fallback"       // prompt not detected; 3s silence used to end response
  | "compacted"      // /compact completed
  | "done"           // exchange complete
  | "error";         // exchange error

export interface AtriumContextStatus {
  used: number;
  total: number;
  pct: number;
}

export interface AtriumSessionEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  created_at: string;
}

export interface AtriumSession {
  id: string;
  title: string;
  session_context: string;
  dial_mode: AtriumDialMode;
  sponsor_type: string | null;
  sponsor_slug: string | null;
  initiative_id: string | null;
  initiative_title: string | null;
  status: AtriumSessionStatus;
  last_activity_at: string | null;
  entry_count: number;
  created_at: string;
  updated_at: string;
}

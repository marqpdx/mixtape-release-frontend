// atriumTypes.ts

export type AtriumSessionStatus = "active" | "closed" | "archived";

export type AtriumDialMode = "expressive" | "very_focused" | "vague";

export type AtriumSSEEventType =
  | "delta"          // response text chunk
  | "activity"       // tool-call activity line (e.g. "Reading foo.md")
  | "context_status" // context window usage update
  | "ready"          // PTY warm — session is ready before first message
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

export interface AtriumSession {
  id: string;
  title: string;
  session_context: string;
  dial_mode: AtriumDialMode;
  sponsor_type: string | null;
  sponsor_slug: string | null;
  status: AtriumSessionStatus;
  last_activity_at: string | null;
  entry_count: number;
  created_at: string;
  updated_at: string;
}

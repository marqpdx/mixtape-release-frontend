// atriumTypes.ts

export type AtriumSessionStatus = "active" | "closed" | "archived";

export type AtriumDialMode = "expressive" | "very_focused" | "vague";

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
  status: AtriumSessionStatus;
  last_activity_at: string | null;
  entry_count: number;
  created_at: string;
  updated_at: string;
}

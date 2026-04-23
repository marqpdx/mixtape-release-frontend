export type InitiativeVerb =
  | 'note'
  | 'remind'
  | 'task'
  | 'draft'
  | 'add'
  | 'find'
  | 'research'
  | 'summarize';

export type InitiativeComposerState =
  | 'idle'
  | 'editing'
  | 'processing_voice'
  | 'confirming'
  | 'executing'
  | 'result';

export interface ParsedInitiativeCommand {
  commandId?: string;
  verb: InitiativeVerb | null;
  rawInput: string;
  confidence: 'high' | 'medium' | 'low';
  title: string;
  summary: string;
  fields: Array<{ label: string; value: string }>;
  generatedText?: string;
  needsClarification?: boolean;
  clarificationReason?: string;
  resultType?: 'acknowledgment' | 'generated_artifact' | 'search_results' | null;
  resultPayload?: Record<string, unknown> | null;
  routing?: Record<string, unknown> | null;
}

export interface InitiativeSessionItem {
  id: string;
  kind: 'command' | 'processing_voice' | 'result' | 'error';
  title: string;
  body: string;
  createdAt: string;
  tone: 'neutral' | 'info' | 'success' | 'error';
  verb: InitiativeVerb | null;
}

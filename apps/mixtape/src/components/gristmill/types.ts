// src/components/gristmill/types.ts

export interface GristBlock {
  type: string;
  title: string;  // From /type Title declaration
  fields: Record<string, string>;
  errors: Array<{field?: string; type: string; message: string}>;
  line?: number;
}

export interface ParseResult {
  blocks: GristBlock[];
}

export interface MillDraft {
  id: string;
  block_type: string;
  ast: GristBlock;
  status: 'staged' | 'promoted' | 'rejected';
  created_at: string;
}

export type SponsorContext =
  | { type: 'group'; slug: string }
  | { type: 'member'; slug: string };

// src/lib/writer/draftUtils.ts

export interface DraftPayload {
  title: string;
  docJSON: any;
  summary: string;
}

export const createDraftKey = (draftId?: string): string => {
  return draftId ? `edit-draft-${draftId}` : "write-composer-new";
};

export const calculateWordCount = (text: string): number => {
  return text.trim() ? text.trim().split(/\s+/).filter((w: string) => w.length > 0).length : 0;
};

export const cleanSummaryText = (summary: string): string => {
  return summary.replace(/\s*\(\d+\s+words?\)\.?\s*$/i, '');
};

export const estimateReadingTime = (wordCount: number, wordsPerMinute: number = 200): number => {
  return Math.ceil(wordCount / wordsPerMinute);
};
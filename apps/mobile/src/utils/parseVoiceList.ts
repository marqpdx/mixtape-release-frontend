// utils/parseVoiceList.ts
//
// Parses a voice transcription into a list of individual items.
// Used by OpsScreen for "We Need More" and "We Need To" captures
// where the user speaks multiple items in a single recording.
//
// OP-OQ3 threshold: items with avg word count <= 8 are treated as a list.
// Fine-tune the threshold as real-world data accumulates.

const MAX_WORD_THRESHOLD = 8;

function cleanItem(text: string): string {
  return text
    .trim()
    .replace(/^\d+[.)]\s*/, '')   // remove numbered prefixes: "1. " "2) "
    .replace(/^[-•*]\s*/, '')     // remove bullet points
    .replace(/\band\s+$/i, '')    // trailing "and" from last item before split
    .trim();
}

export function parseVoiceList(text: string): string[] {
  if (!text.trim()) return [];

  // Split on commas, semicolons, and newlines
  const rawParts = text.split(/[,;]\s*|\n+/);
  const parts = rawParts.map(cleanItem).filter((p) => p.length > 0);

  if (parts.length <= 1) {
    // Nothing to split — return as single item
    return text.trim() ? [text.trim()] : [];
  }

  // Determine if this looks like a list: avg words per item <= threshold
  const totalWords = parts.reduce((sum, p) => sum + p.split(/\s+/).length, 0);
  const avgWords = totalWords / parts.length;

  if (avgWords <= MAX_WORD_THRESHOLD) {
    return parts;
  }

  // Avg word count is high — probably a paragraph, not a list
  return [text.trim()];
}

// Kinds for which multi-item parsing is applied
export const LIST_PARSE_KINDS = new Set(['need_more', 'fix']);

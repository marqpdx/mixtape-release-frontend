// src/lib/writing/generateExcerpt.ts
//
// Mirrors generate_excerpt() and generate_excerpt_from_prosemirror() in
// mixtape-release-core's app/utils/writing/writing_utils.py. Keep the two
// in sync — this is the client-side path for surfaces (e.g. PublishPanel)
// that need a suggested excerpt without a round-trip to the backend.

export type ProseMirrorNode = {
  type?: string;
  text?: string;
  content?: ProseMirrorNode[];
};

export type ProseMirrorDoc = {
  content?: ProseMirrorNode[];
};

const SKIP_BLOCK_TYPES = new Set(["heading", "image", "horizontalRule", "codeBlock"]);

function extractNodeText(node: ProseMirrorNode | undefined | null): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (node.content) return node.content.map(extractNodeText).join(" ");
  return "";
}

/** Sentence-boundary-aware truncation, falling back to word boundary. */
export function generateExcerpt(text: string, maxLength = 200): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;

  const window = text.slice(0, maxLength + 50);
  const sentences = window.split(/[.!?]+/);
  if (sentences.length > 1) {
    const candidate = `${sentences[0]}.`;
    if (candidate.length <= maxLength) return candidate;
  }

  const words = text.slice(0, maxLength).split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    return `${words.slice(0, -1).join(" ")}...`;
  }
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Finds the first ProseMirror block that carries real prose — skipping
 * headings, images, code blocks, and horizontal rules — then truncates
 * that block's text via generateExcerpt(). Returns "" if no such block
 * has any text (e.g. a heading-only document).
 */
export function generateExcerptFromProsemirror(
  doc: ProseMirrorDoc | null | undefined,
  maxLength = 200
): string {
  if (!doc || !doc.content) return "";
  for (const block of doc.content) {
    if (!block) continue;
    if (block.type && SKIP_BLOCK_TYPES.has(block.type)) continue;
    const text = extractNodeText(block).trim();
    if (text) return generateExcerpt(text, maxLength);
  }
  return "";
}

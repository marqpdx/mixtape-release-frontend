import type { Editor } from "@tiptap/react";

export type SpellToken = { text: string; from: number; to: number };
export type SpellFinding = SpellToken & { suggestions: string[] };

const WORD_RE = /\p{L}+(?:['’]\p{L}+)*/gu;

export function collectSpellTokens(editor: Editor): SpellToken[] {
  const tokens: SpellToken[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "codeBlock") return false;
    if (!node.isText || !node.text || node.marks.some((mark) => mark.type.name === "code" || mark.type.name === "link")) return;

    for (const match of node.text.matchAll(WORD_RE)) {
      const from = match.index ?? 0;
      const before = node.text[from - 1] ?? "";
      const after = node.text[from + match[0].length] ?? "";
      const segmentStart = Math.max(0, node.text.lastIndexOf(" ", from - 1) + 1);
      const segmentEnd = node.text.indexOf(" ", from);
      const segment = node.text.slice(segmentStart, segmentEnd < 0 ? undefined : segmentEnd);
      if (before === "/" || after === "/" || /\d/.test(before + after) || /:\/\/|www\.|@/.test(segment)) continue;
      tokens.push({ text: match[0], from: pos + from, to: pos + from + match[0].length });
    }
  });
  return tokens;
}

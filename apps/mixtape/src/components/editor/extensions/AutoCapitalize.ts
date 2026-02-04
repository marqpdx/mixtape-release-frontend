// src/components/editor/extensions/AutoCapitalize.ts
/**
 * AutoCapitalize Extension
 *
 * Automatically capitalizes the first letter of sentences.
 * Triggers after sentence-ending punctuation followed by space.
 *
 * Part of PocketTools - Writing Helpers
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { TextSelection } from '@tiptap/pm/state';

// Sentence-ending punctuation followed by space pattern
const SENTENCE_END_CHARS = ['.', '!', '?'];

export interface AutoCapitalizeOptions {
  /**
   * Whether auto-capitalize is enabled
   * @default true
   */
  enabled: boolean;
}

export const AutoCapitalize = Extension.create<AutoCapitalizeOptions>({
  name: 'autoCapitalize',

  addOptions() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const { enabled } = this.options;

    return [
      new Plugin({
        key: new PluginKey('autoCapitalize'),

        appendTransaction(transactions, oldState, newState) {
          if (!enabled) return null;

          // Only process if there were actual changes
          const docChanged = transactions.some(tr => tr.docChanged);
          if (!docChanged) return null;

          // Get the last transaction that changed the doc
          const lastTr = transactions.filter(tr => tr.docChanged).pop();
          if (!lastTr) return null;

          // Check if this was a text input (single character addition)
          const steps = lastTr.steps;
          if (steps.length !== 1) return null;

          const { selection } = newState;
          if (!(selection instanceof TextSelection)) return null;

          const { $from } = selection;
          const pos = $from.pos;

          // Need at least 3 characters before cursor: [.!?] + space + letter
          if (pos < 3) return null;

          // Get the text before the cursor
          const textBefore = newState.doc.textBetween(
            Math.max(0, pos - 3),
            pos,
            '\n'
          );

          // Check pattern: sentence-end punctuation + space + lowercase letter
          if (textBefore.length < 3) return null;

          const punctChar = textBefore[textBefore.length - 3];
          const spaceChar = textBefore[textBefore.length - 2];
          const letterChar = textBefore[textBefore.length - 1];

          // Verify pattern
          if (!SENTENCE_END_CHARS.includes(punctChar)) return null;
          if (spaceChar !== ' ') return null;
          if (!/[a-z]/.test(letterChar)) return null;

          // Capitalize the letter
          const capitalLetter = letterChar.toUpperCase();
          const charPos = pos - 1;

          const tr = newState.tr;
          tr.replaceWith(
            charPos,
            charPos + 1,
            newState.schema.text(capitalLetter)
          );

          // Keep cursor in same logical position
          tr.setSelection(TextSelection.create(tr.doc, pos));

          return tr;
        },
      }),
    ];
  },
});

export default AutoCapitalize;

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

          const charPos = pos - 1;
          const letterChar = newState.doc.textBetween(charPos, pos, '\n');
          if (!/[a-z]/.test(letterChar)) return null;

          // Decide if this lowercase letter begins a sentence:
          // 1) start of document
          // 2) beginning of a new line/paragraph
          // 3) after punctuation + space
          const prefix = newState.doc.textBetween(Math.max(0, pos - 4), pos - 1, '\n');
          const sentenceBoundaryPattern = /(?:^|\n|[.!?]\s)$/;
          if (!sentenceBoundaryPattern.test(prefix)) return null;

          // Capitalize the letter
          const capitalLetter = letterChar.toUpperCase();

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

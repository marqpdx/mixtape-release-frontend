// src/lib/writing/gristRegistry.ts
//
// Typed command registry for the Write area grist command system.
// Each surface maintains its own registry. This file owns the Copy Desk set.
// Adding a new command = one entry here. Both activation modes (Suggestion
// popup and paragraph-fenced InputRule) look up commands from this registry.
//
// See: puddlejump/reference/grist/grist-tenets.md

import type { Editor } from '@tiptap/core'

export interface GristCommand {
  id: string
  label: string
  description: string
  execute: (editor: Editor, args?: string) => void
}

export const gristRegistry = new Map<string, GristCommand>([
  [
    'split',
    {
      id: 'split',
      label: '/split',
      description: 'Mark a split point — divide this piece into two',
      execute: (editor, args) => {
        editor.commands.insertSplitMarker({
          source: 'manual',
          title: args?.trim() || null,
          rationale: null,
        })
      },
    },
  ],
])

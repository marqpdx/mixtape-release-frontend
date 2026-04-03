// extensions/GristCommands.ts
//
// TipTap extension providing two activation modes for Write area grist commands:
//
// Mode A — Suggestion popup (discovery)
//   Triggered by typing "/" at the start of a line. Shows the grist command
//   menu. Selecting a command executes it via the gristRegistry.
//
// Mode B — Paragraph-fenced Enter (intentional)
//   When the current paragraph's entire content is "/command [optional args]"
//   and the user presses Enter, the paragraph is replaced with the command's
//   node output. No popup required — a deliberate power-user gesture.
//
// Both modes pull commands from gristRegistry.
// See: puddlejump/reference/grist/grist-tenets.md §4

import { Extension } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion from '@tiptap/suggestion'
import type { SuggestionOptions } from '@tiptap/suggestion'
import { gristRegistry } from '@/lib/writing/gristRegistry'
import type { GristCommandItem } from './GristCommandsList'

export interface GristCommandsOptions {
  suggestion: Partial<SuggestionOptions<GristCommandItem>>
}

export const gristCommandsPluginKey = new PluginKey('gristCommands')

function registryItems(): GristCommandItem[] {
  return Array.from(gristRegistry.values()).map((cmd) => ({
    id: cmd.id,
    label: cmd.label,
    description: cmd.description,
  }))
}

export const GristCommands = Extension.create<GristCommandsOptions>({
  name: 'gristCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: true,
        allowSpaces: true,
        pluginKey: gristCommandsPluginKey,
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase()
          return registryItems().filter(
            (item) =>
              item.id.includes(q) ||
              item.label.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q)
          )
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        command: ({ editor, range, props }) => {
          const item = props as unknown as GristCommandItem
          const cmd = gristRegistry.get(item.id)
          if (!cmd) return

          // Delete the slash command text then execute
          editor.chain().focus().deleteRange(range).run()
          cmd.execute(editor)
        },
      }),
    ]
  },

  // Mode B: pressing Enter when the current paragraph contains only
  // "/commandName [optional args]" replaces the paragraph with the
  // command's output node.
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { $from } = editor.state.selection

        // Only fire in a paragraph at depth 1 (top-level block)
        if ($from.parent.type.name !== 'paragraph') return false
        const text = $from.parent.textContent.trim()

        // Match /commandName or /commandName args
        const match = /^\/([a-z]+)(\s+(.+))?$/.exec(text)
        if (!match) return false

        const commandId = match[1]
        const args = match[3]?.trim()
        const cmd = gristRegistry.get(commandId)
        if (!cmd) return false

        // Replace the whole paragraph block with the command's output
        const blockStart = $from.before($from.depth)
        const blockEnd = $from.after($from.depth)

        editor
          .chain()
          .focus()
          .command(({ tr, dispatch }) => {
            // First delete the paragraph
            tr.delete(blockStart, blockEnd)
            if (dispatch) dispatch(tr)
            return true
          })
          .run()

        // Then execute the grist command (inserts its node at cursor)
        cmd.execute(editor, args)
        return true
      },
    }
  },
})

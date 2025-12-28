// utils/getSelectedBlocks.ts

import { Editor } from "@tiptap/core"
import type { Node } from "@tiptap/pm/model"

export function getSelectedBlockIds(editor: Editor) {
  const ids: string[] = []
  const seen = new Set<string>()
  const { from, to } = editor.state.selection
  editor.state.doc.nodesBetween(from, to, (node: Node) => {
    if (node.isBlock && node.attrs?.blockId && !seen.has(node.attrs.blockId)) {
      ids.push(node.attrs.blockId)
      seen.add(node.attrs.blockId)
    }
  })
  return ids
}

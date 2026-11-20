'use client'

// Editor view of a dialogueAside node: the same phrase and popover readers
// get, plus an Edit button that reopens the dialog.

import { useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Button } from '@chakra-ui/react'
import { DialogueAside, readDialogueAside } from '@mixtape/content/writingExtras'
import { DialogueAsideDialog } from '../DialogueAsideControl'

export function DialogueAsideView({ node, updateAttributes, editor, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false)
  return (
    <NodeViewWrapper as="span" className="dav-root" contentEditable={false}
      style={selected ? { outline: '2px solid var(--chakra-colors-teal-400)', outlineOffset: 2, borderRadius: 3 } : undefined}>
      <DialogueAside
        attrs={node.attrs}
        footer={editor.isEditable ? (close) => (
          <Button size="xs" variant="outline" alignSelf="flex-end"
            onClick={() => { close(); setEditing(true) }}>Edit aside</Button>
        ) : undefined}
      />
      {editing && (
        <DialogueAsideDialog
          open
          initial={readDialogueAside(node.attrs)}
          onClose={() => setEditing(false)}
          onSave={(attrs) => { updateAttributes(attrs); setEditing(false) }}
        />
      )}
    </NodeViewWrapper>
  )
}

"use client"
// AddCommentBubble.tsx
// Floating button that appears when the user has a non-empty text selection
// inside a Dispatch doc. Click → generates an anchor_id, applies CommentMark
// to the selection, and opens the inline comment input.

import { useEffect, useRef, useState } from 'react'
import { Box, IconButton } from '@chakra-ui/react'
import { Tooltip } from '@components/ui/tooltip'
import { IconMessage } from '@tabler/icons-react'
import type { Editor } from '@tiptap/react'
import { v4 as uuid } from 'uuid'

interface Props {
  editor: Editor | null
  canComment: boolean
  onStartComment: (params: {
    commentId: string
    blockId: string | null
    anchorFrom: number
    anchorTo: number
    quotedText: string
  }) => void
}

export function AddCommentBubble({ editor, canComment, onStartComment }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!editor || !canComment) return

    const update = () => {
      const { selection } = editor.state
      if (selection.empty) {
        setPos(null)
        return
      }
      const { from, to } = selection
      const startCoords = editor.view.coordsAtPos(from)
      const endCoords = editor.view.coordsAtPos(to)
      const editorDom = editor.view.dom
      const rect = editorDom.getBoundingClientRect()
      setPos({
        top: Math.min(startCoords.top, endCoords.top) - rect.top - 40,
        left: (startCoords.left + endCoords.left) / 2 - rect.left,
      })
    }

    const onSelectionUpdate = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }

    editor.on('selectionUpdate', onSelectionUpdate)
    return () => {
      editor.off('selectionUpdate', onSelectionUpdate)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [editor, canComment])

  if (!pos || !editor || !canComment) return null

  const handleClick = () => {
    const { selection, doc } = editor.state
    if (selection.empty) return

    const { from, to } = selection
    const quotedText = doc.textBetween(from, to, ' ')
    const commentId = uuid()

    // Find the block containing the selection start
    const $from = doc.resolve(from)
    const blockNode = $from.parent
    const blockId: string | null = (blockNode.attrs as Record<string, unknown>).blockId as string | null ?? null
    // Char offsets within the block
    const blockStart = $from.start()
    const anchorFrom = from - blockStart
    const anchorTo = Math.min(to, $from.end()) - blockStart

    // Apply highlight mark to the selected range
    editor.chain().setCommentMark(commentId).run()

    onStartComment({ commentId, blockId, anchorFrom, anchorTo, quotedText })
    setPos(null)
  }

  return (
    <Box
      position="absolute"
      top={`${pos.top}px`}
      left={`${pos.left}px`}
      transform="translateX(-50%)"
      zIndex={100}
      pointerEvents="auto"
    >
      <Tooltip content="Add comment">
        <IconButton
          aria-label="Add comment"
          size="sm"
          variant="solid"
          colorPalette="yellow"
          borderRadius="full"
          onClick={handleClick}
          boxShadow="md"
        >
          <IconMessage size={14} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

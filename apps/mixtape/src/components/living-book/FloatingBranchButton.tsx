'use client'

import { useEffect, useRef, useState } from 'react'
import { Box, IconButton } from '@chakra-ui/react'
import { IconGitBranch } from '@tabler/icons-react'
import { useColorModeValue } from '@components/ui/color-mode'
import type { Editor } from '@tiptap/react'

interface FloatingBranchButtonProps {
  editor: Editor | null
  containerRef: React.RefObject<HTMLDivElement | null>
  onAddBranch: () => void
  isPending?: boolean
}

export function FloatingBranchButton({
  editor,
  containerRef,
  onAddBranch,
  isPending = false,
}: FloatingBranchButtonProps) {
  const [y, setY] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('teal.200', 'teal.600')
  const color = useColorModeValue('teal.600', 'teal.300')

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      const container = containerRef.current
      if (!container) return

      try {
        const { from } = editor.state.selection
        const coords = editor.view.coordsAtPos(from)
        const rect = container.getBoundingClientRect()
        // Mid-line Y relative to container, accounting for scroll
        const relY = coords.top - rect.top + container.scrollTop + (coords.bottom - coords.top) / 2

        setY(relY)
        setVisible(false)

        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setVisible(true), 800)
      } catch {
        // editor may not be ready yet
      }
    }

    editor.on('selectionUpdate', handleSelectionUpdate)
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [editor, containerRef])

  if (y === null) return null

  return (
    <Box
      position="absolute"
      right="-38px"
      top={`${y - 12}px`}
      zIndex={10}
      opacity={visible ? 1 : 0}
      transition="opacity 0.25s ease"
      pointerEvents={visible && !isPending ? 'auto' : 'none'}
    >
      <IconButton
        size="xs"
        variant="outline"
        borderRadius="full"
        bg={bg}
        borderColor={borderColor}
        color={color}
        onClick={onAddBranch}
        loading={isPending}
        title="Add branch here"
        aria-label="Add branch"
        _hover={{ bg: 'teal.50', borderColor: 'teal.400' }}
      >
        <IconGitBranch size={12} />
      </IconButton>
    </Box>
  )
}

// SortableItemWrapper.tsx

"use client"

import type { ReactNode } from "react"
import { Box, HStack } from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { IconGripVertical } from "@tabler/icons-react"

interface SortableItemWrapperProps {
  id: string
  children: ReactNode
  isDragOverlay?: boolean
}

export function SortableItemWrapper({
  id,
  children,
  isDragOverlay,
}: SortableItemWrapperProps) {
  const gripColor = useColorModeValue("gray.400", "gray.500")

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isDragOverlay })

  const style = isDragOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }

  return (
    <HStack ref={setNodeRef} style={style} gap={0} align="stretch">
      <Box
        {...attributes}
        {...listeners}
        cursor="grab"
        color={gripColor}
        _hover={{ color: "gray.600" }}
        _active={{ cursor: "grabbing" }}
        display="flex"
        alignItems="center"
        px={1}
        flexShrink={0}
      >
        <IconGripVertical size={16} />
      </Box>
      <Box flex={1} minW={0}>
        {children}
      </Box>
    </HStack>
  )
}

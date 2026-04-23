"use client"

// LB-5: Structure Panel — tree view with collapse/expand, add, remove, reorder

import { useState } from "react"
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Button,
  Spinner,
  Input,
} from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"
import Link from "next/link"
import {
  IconChevronDown,
  IconChevronRight,
  IconPlus,
  IconTrash,
  IconGripVertical,
  IconFile,
  IconFolder,
} from "@tabler/icons-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useLivingBookTree, useLivingBookMutations } from "@hooks/useLivingBook"
import type { LivingBookNode } from "@mixtape/api/clients/livingBook/livingBookApi"

interface StructurePanelProps {
  livingBookId: string
  isEditor: boolean
  username?: string
}

interface SortableNodeProps {
  node: LivingBookNode
  livingBookId: string
  isEditor: boolean
  username?: string
  onRemove: (pieceId: string) => void
  onAddChild: (parentId: string) => void
}

function SortableNode({
  node,
  livingBookId,
  isEditor,
  username,
  onRemove,
  onAddChild,
}: SortableNodeProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: node.obj.id,
  })

  const borderColor = useColorModeValue("gray.100", "gray.700")
  const draftColor = useColorModeValue("orange.500", "orange.300")
  const mutedColor = useColorModeValue("gray.400", "gray.500")
  const hoverBg = useColorModeValue("gray.50", "gray.750")

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const pieceHref = username
    ? `/member/${username}/writing/${node.obj.slug}?lb=${livingBookId}`
    : `#`

  const indentPx = node.depth * 16

  return (
    <Box ref={setNodeRef} style={style}>
      <HStack
        gap={1}
        pl={`${indentPx}px`}
        py={1}
        px={2}
        borderRadius="md"
        _hover={{ bg: hoverBg }}
        role="group"
      >
        {isEditor && (
          <Box
            cursor="grab"
            color={mutedColor}
            {...attributes}
            {...listeners}
            flexShrink={0}
          >
            <IconGripVertical size={14} />
          </Box>
        )}

        <IconButton
          aria-label={collapsed ? "Expand" : "Collapse"}
          size="xs"
          variant="ghost"
          onClick={() => setCollapsed((c) => !c)}
          flexShrink={0}
          visibility={node.depth < 3 ? "visible" : "hidden"}
        >
          {collapsed ? <IconChevronRight size={12} /> : <IconChevronDown size={12} />}
        </IconButton>

        <Box color={mutedColor} flexShrink={0}>
          {node.depth === 0 ? <IconFolder size={14} /> : <IconFile size={14} />}
        </Box>

        <Link href={pieceHref} style={{ flex: 1, minWidth: 0 }}>
          <Text
            fontSize="sm"
            fontWeight={node.depth === 0 ? "semibold" : "normal"}
            noOfLines={1}
            color={!node.is_published && isEditor ? draftColor : undefined}
          >
            {node.obj.title || "Untitled"}
            {!node.is_published && isEditor && (
              <Text as="span" fontSize="xs" ml={1} opacity={0.7}>
                draft
              </Text>
            )}
          </Text>
        </Link>

        {isEditor && (
          <HStack gap={0} opacity={0} _groupHover={{ opacity: 1 }} flexShrink={0}>
            {node.depth < 3 && (
              <IconButton
                aria-label="Add child node"
                size="xs"
                variant="ghost"
                onClick={() => onAddChild(node.obj.id)}
              >
                <IconPlus size={12} />
              </IconButton>
            )}
            <IconButton
              aria-label="Remove node"
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={() => onRemove(node.obj.id)}
            >
              <IconTrash size={12} />
            </IconButton>
          </HStack>
        )}
      </HStack>
    </Box>
  )
}

export function StructurePanel({ livingBookId, isEditor, username }: StructurePanelProps) {
  const { data: nodes = [], isLoading } = useLivingBookTree(livingBookId)
  const { removeNode, reorderNodes, createAddNode } = useLivingBookMutations(livingBookId)
  const [addingToParent, setAddingToParent] = useState<string | null>(null)
  const [newNodeTitle, setNewNodeTitle] = useState("")

  const borderColor = useColorModeValue("gray.200", "gray.700")
  const bgColor = useColorModeValue("white", "gray.800")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const parentId = addingToParent
    const siblings = nodes.filter(
      (n) =>
        n.depth ===
        (nodes.find((x) => x.obj.id === String(active.id))?.depth ?? 0)
    )
    const oldIndex = siblings.findIndex((n) => n.obj.id === active.id)
    const newIndex = siblings.findIndex((n) => n.obj.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...siblings]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    reorderNodes.mutate({
      parent_id: parentId,
      ordered_piece_ids: reordered.map((n) => n.obj.id),
    })
  }

  const handleRemove = (pieceId: string) => {
    removeNode.mutate({ piece_id: pieceId })
  }

  const handleAddChild = (parentId: string) => {
    setAddingToParent(parentId)
    setNewNodeTitle("")
  }

  const handleCreateNode = () => {
    if (!newNodeTitle.trim() && addingToParent === null) return
    createAddNode.mutate(
      {
        title: newNodeTitle.trim() || undefined,
        parent_id: addingToParent ?? undefined,
      },
      {
        onSuccess: () => {
          setAddingToParent(null)
          setNewNodeTitle("")
        },
      }
    )
  }

  if (isLoading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="sm" />
      </Box>
    )
  }

  return (
    <Box
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      bg={bgColor}
      overflow="hidden"
    >
      <HStack px={3} py={2} borderBottom="1px solid" borderColor={borderColor}>
        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
          Structure
        </Text>
        {isEditor && (
          <IconButton
            aria-label="Add root node"
            size="xs"
            variant="ghost"
            ml="auto"
            onClick={() => handleAddChild("")}
          >
            <IconPlus size={14} />
          </IconButton>
        )}
      </HStack>

      <Box py={1}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={nodes.map((n) => n.obj.id)}
            strategy={verticalListSortingStrategy}
          >
            <VStack gap={0} align="stretch">
              {nodes.map((node) => (
                <SortableNode
                  key={node.obj.id}
                  node={node}
                  livingBookId={livingBookId}
                  isEditor={isEditor}
                  username={username}
                  onRemove={handleRemove}
                  onAddChild={handleAddChild}
                />
              ))}
            </VStack>
          </SortableContext>
        </DndContext>

        {nodes.length === 0 && (
          <Text fontSize="sm" color="gray.400" px={3} py={2}>
            No nodes yet.{isEditor ? " Add one above." : ""}
          </Text>
        )}
      </Box>

      {isEditor && addingToParent !== null && (
        <Box px={3} py={2} borderTop="1px solid" borderColor={borderColor}>
          <HStack gap={2}>
            <Input
              size="sm"
              placeholder="Node title (optional)"
              value={newNodeTitle}
              onChange={(e) => setNewNodeTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateNode()}
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleCreateNode}
              loading={createAddNode.isPending}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAddingToParent(null)}
            >
              Cancel
            </Button>
          </HStack>
        </Box>
      )}
    </Box>
  )
}

// ContainerView.tsx

"use client"

import { useState, useCallback } from "react"
import {
  Box,
  Flex,
  HStack,
  IconButton,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { IconLayoutGrid, IconList } from "@tabler/icons-react"
import type { ContainerItem, ContainerViewProps } from "./ContainerView.types"
import { ContainerGridItem } from "./ContainerGridItem"
import { ContainerListItem } from "./ContainerListItem"
import { SortableItemWrapper } from "./SortableItemWrapper"

export function ContainerView<T extends ContainerItem>({
  items,
  viewMode,
  onViewModeChange,
  onItemClick,
  onRemoveItem,
  actions,
  sortable = false,
  onReorder,
  renderGridItem,
  renderListItem,
  renderBadge,
  isLoading,
  error,
  emptyStateMessage = "No items yet.",
  emptyStateAction,
}: ContainerViewProps<T>) {
  const mutedText = useColorModeValue("gray.500", "gray.400")
  const activeBg = useColorModeValue("gray.100", "gray.700")
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return

      const reordered = arrayMove(items, oldIndex, newIndex)
      onReorder?.(reordered.map((i) => i.id))
    },
    [items, onReorder]
  )

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null

  // --- Loading ---
  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={12}>
        <HStack gap={3} color={mutedText}>
          <Spinner size="md" />
          <Text>Loading...</Text>
        </HStack>
      </Flex>
    )
  }

  // --- Error ---
  if (error) {
    return (
      <Box textAlign="center" py={12}>
        <Text color="red.500">{error}</Text>
      </Box>
    )
  }

  // --- Empty ---
  if (items.length === 0) {
    return (
      <Box textAlign="center" py={12}>
        <Text color={mutedText}>{emptyStateMessage}</Text>
        {emptyStateAction && <Box mt={4}>{emptyStateAction}</Box>}
      </Box>
    )
  }

  // --- Render item ---
  function renderItem(item: T) {
    if (viewMode === "grid") {
      if (renderGridItem) return renderGridItem(item)
      return (
        <ContainerGridItem
          item={item}
          onItemClick={onItemClick}
          onRemoveItem={onRemoveItem}
          actions={actions}
          renderBadge={renderBadge}
        />
      )
    }
    if (renderListItem) return renderListItem(item)
    return (
      <ContainerListItem
        item={item}
        onItemClick={onItemClick}
        onRemoveItem={onRemoveItem}
        actions={actions}
        renderBadge={renderBadge}
      />
    )
  }

  // --- View toggle ---
  const viewToggle = onViewModeChange ? (
    <HStack gap={1}>
      <IconButton
        aria-label="Grid view"
        variant="ghost"
        size="sm"
        bg={viewMode === "grid" ? activeBg : undefined}
        onClick={() => onViewModeChange("grid")}
      >
        <IconLayoutGrid size={18} />
      </IconButton>
      <IconButton
        aria-label="List view"
        variant="ghost"
        size="sm"
        bg={viewMode === "list" ? activeBg : undefined}
        onClick={() => onViewModeChange("list")}
      >
        <IconList size={18} />
      </IconButton>
    </HStack>
  ) : null

  // --- Item list ---
  const itemIds = items.map((i) => i.id)

  const content =
    viewMode === "grid" ? (
      <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} gap={3}>
        {items.map((item) =>
          sortable ? (
            <SortableItemWrapper key={item.id} id={item.id}>
              {renderItem(item)}
            </SortableItemWrapper>
          ) : (
            <Box key={item.id}>{renderItem(item)}</Box>
          )
        )}
      </SimpleGrid>
    ) : (
      <VStack gap={0} align="stretch">
        {items.map((item) =>
          sortable ? (
            <SortableItemWrapper key={item.id} id={item.id}>
              {renderItem(item)}
            </SortableItemWrapper>
          ) : (
            <Box key={item.id}>{renderItem(item)}</Box>
          )
        )}
      </VStack>
    )

  // --- Drag overlay ---
  const dragOverlay = activeItem ? (
    <DragOverlay>
      <Box opacity={0.9} shadow="lg">
        {renderItem(activeItem)}
      </Box>
    </DragOverlay>
  ) : null

  return (
    <Box>
      {viewToggle && (
        <Flex justify="flex-end" mb={4}>
          {viewToggle}
        </Flex>
      )}

      {sortable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={itemIds}
            strategy={
              viewMode === "grid"
                ? rectSortingStrategy
                : verticalListSortingStrategy
            }
          >
            {content}
          </SortableContext>
          {dragOverlay}
        </DndContext>
      ) : (
        content
      )}
    </Box>
  )
}

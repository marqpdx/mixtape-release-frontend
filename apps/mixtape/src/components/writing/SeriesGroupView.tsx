// src/components/writing/SeriesGroupView.tsx
'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  Spinner,
} from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical, IconPencil, IconFileText, IconCheck } from '@tabler/icons-react'
import { toaster } from '@mixtape/core/lib/toaster'
import * as writingApi from '@mixtape/api/clients/writing/writingApi'
import type { FlattenedPlacement, WorkingDocument } from '@mixtape/core/types/writingTypes'

// ─── Unified item type ─────────────────────────────────────────────────────

interface SeriesItem {
  id: string          // unique key: piece_id
  pieceId: string
  pieceSlug: string
  title: string
  status: 'published' | 'scheduled' | 'draft'
  seriesId: string | null
  seriesTitle: string | null
  seriesPhaseNum: number | null
  seriesOrder: number | null
}

function placementToItem(p: FlattenedPlacement): SeriesItem {
  return {
    id: p.piece_id,
    pieceId: p.piece_id,
    pieceSlug: p.piece_slug,
    title: p.piece_title,
    status: p.piece_status === 'scheduled' ? 'scheduled' : 'published',
    seriesId: p.series_id ?? null,
    seriesTitle: p.series_title ?? null,
    seriesPhaseNum: p.series_phase_num ?? null,
    seriesOrder: p.series_order ?? null,
  }
}

function draftToItem(d: WorkingDocument): SeriesItem {
  return {
    id: d.piece.id,
    pieceId: d.piece.id,
    pieceSlug: d.piece.slug,
    title: d.title || d.piece.title || 'Untitled draft',
    status: 'draft',
    seriesId: d.piece.series_id ?? null,
    seriesTitle: d.piece.series_title ?? null,
    seriesPhaseNum: d.piece.series_phase_num ?? null,
    seriesOrder: d.piece.series_order ?? null,
  }
}

// ─── Sortable row ──────────────────────────────────────────────────────────

function SortableRow({
  item,
  onEdit,
  onDetail,
  borderColor,
  metaColor,
}: {
  item: SeriesItem
  onEdit: (pieceId: string) => void
  onDetail?: (pieceSlug: string) => void
  borderColor: string
  metaColor: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const statusColor =
    item.status === 'published' ? 'green' :
    item.status === 'scheduled' ? 'blue' :
    'gray'

  const statusLabel =
    item.status === 'published' ? 'Published' :
    item.status === 'scheduled' ? 'Scheduled' :
    'Draft'

  return (
    <Box
      ref={setNodeRef}
      style={style}
      borderBottomWidth="1px"
      borderColor={borderColor}
      py={3}
      px={2}
    >
      <HStack gap={3} align="center">
        {/* Drag handle */}
        <Box
          {...attributes}
          {...listeners}
          color={metaColor}
          cursor="grab"
          _active={{ cursor: 'grabbing' }}
          flexShrink={0}
          display="flex"
          alignItems="center"
        >
          <IconGripVertical size={16} />
        </Box>

        {/* Order indicator */}
        <Box
          w="20px"
          textAlign="center"
          fontSize="xs"
          color={metaColor}
          flexShrink={0}
        >
          {item.seriesOrder != null ? item.seriesOrder + 1 : '—'}
        </Box>

        {/* Title */}
        <Text fontSize="sm" fontWeight="medium" flex={1} lineClamp={1}>
          {item.title}
        </Text>

        {/* Status badge */}
        <Badge size="xs" colorPalette={statusColor} variant="subtle" flexShrink={0}>
          {statusLabel}
        </Badge>

        {/* Actions */}
        <HStack gap={1} flexShrink={0}>
          {item.status !== 'draft' && onDetail && (
            <Box
              as="button"
              p={1}
              color={metaColor}
              _hover={{ color: 'inherit' }}
              onClick={() => onDetail(item.pieceSlug)}
              title="View"
            >
              <IconCheck size={14} />
            </Box>
          )}
          <Box
            as="button"
            p={1}
            color={metaColor}
            _hover={{ color: 'inherit' }}
            onClick={() => onEdit(item.pieceId)}
            title="Edit"
          >
            <IconPencil size={14} />
          </Box>
        </HStack>
      </HStack>
    </Box>
  )
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface SeriesGroupViewProps {
  placements: FlattenedPlacement[]
  drafts: WorkingDocument[]
  onEdit: (pieceId: string) => void
  onDetail?: (pieceSlug: string) => void
}

// ─── Main component ────────────────────────────────────────────────────────

export function SeriesGroupView({ placements, drafts, onEdit, onDetail }: SeriesGroupViewProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const sectionLabelColor = useColorModeValue('blue.600', 'blue.300')
  const metaColor = useColorModeValue('gray.500', 'gray.400')
  const headerBg = useColorModeValue('gray.50', 'gray.800')
  const subtitleColor = useColorModeValue('gray.500', 'gray.400')

  const [saving, setSaving] = useState(false)

  // Build unified list, deduplicate by pieceId (published wins over draft view)
  const allItems = useMemo(() => {
    const seen = new Set<string>()
    const items: SeriesItem[] = []

    // Published placements first
    for (const p of placements) {
      if (!seen.has(p.piece_id)) {
        seen.add(p.piece_id)
        items.push(placementToItem(p))
      }
    }

    // Then drafts (pieces not already represented by a placement)
    for (const d of drafts) {
      if (!seen.has(d.piece.id)) {
        seen.add(d.piece.id)
        items.push(draftToItem(d))
      }
    }

    return items
  }, [placements, drafts])

  // Group by series, preserving phase_num order; null series → "Unassigned"
  const seriesGroups = useMemo(() => {
    type GroupKey = string | null
    const order: GroupKey[] = []
    const map = new Map<GroupKey, { title: string | null; phaseNum: number | null; items: SeriesItem[] }>()

    const sorted = [...allItems].sort((a, b) => {
      const pa = a.seriesPhaseNum ?? Infinity
      const pb = b.seriesPhaseNum ?? Infinity
      if (pa !== pb) return pa - pb
      const oa = a.seriesOrder ?? Infinity
      const ob = b.seriesOrder ?? Infinity
      return oa - ob
    })

    for (const item of sorted) {
      const key = item.seriesId
      if (!map.has(key)) {
        map.set(key, { title: item.seriesTitle, phaseNum: item.seriesPhaseNum, items: [] })
        order.push(key)
      }
      map.get(key)!.items.push(item)
    }

    return order.map(key => ({ key, ...map.get(key)! }))
  }, [allItems])

  // Local reorder state: map of seriesId → items[]
  const [localGroups, setLocalGroups] = useState<typeof seriesGroups | null>(null)
  const groups = localGroups ?? seriesGroups

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(async (event: DragEndEvent, groupKey: string | null) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const targetGroup = (localGroups ?? seriesGroups).find(g => g.key === groupKey)
    if (!targetGroup) return

    const oldIndex = targetGroup.items.findIndex(i => i.id === active.id)
    const newIndex = targetGroup.items.findIndex(i => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(targetGroup.items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      seriesOrder: idx,
    }))

    // Optimistic update
    setLocalGroups(prev => {
      const base = prev ?? seriesGroups
      return base.map(g =>
        g.key === groupKey ? { ...g, items: reordered } : g
      )
    })

    // Find what changed and PATCH
    const changed = reordered.filter((item, idx) => {
      const original = targetGroup.items[idx]
      return original?.id !== item.id || original?.seriesOrder !== item.seriesOrder
    })

    if (changed.length === 0) return

    setSaving(true)
    try {
      await Promise.all(
        reordered.map((item, idx) =>
          writingApi.updatePiece(item.pieceId, { series_order: idx })
        )
      )
    } catch {
      toaster.create({ title: 'Could not save order', type: 'error' })
      setLocalGroups(null) // revert
    } finally {
      setSaving(false)
    }
  }, [localGroups, seriesGroups])

  if (allItems.length === 0) {
    return (
      <Text fontSize="sm" color={metaColor} py={4}>
        No pieces yet.
      </Text>
    )
  }

  return (
    <VStack align="stretch" gap={8} position="relative">
      {saving && (
        <HStack
          gap={2}
          position="absolute"
          top={0}
          right={0}
          fontSize="xs"
          color={metaColor}
        >
          <Spinner size="xs" />
          <Text>Saving order…</Text>
        </HStack>
      )}

      {groups.map(group => (
        <Box key={group.key ?? '__unassigned__'}>
          {/* Section header */}
          <Box
            px={3}
            py={2}
            bg={headerBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
            mb={0}
          >
            <HStack justify="space-between">
              <VStack align="start" gap={0}>
                {group.key ? (
                  <>
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      letterSpacing="widest"
                      textTransform="uppercase"
                      color={sectionLabelColor}
                    >
                      {group.title ?? `Phase ${group.phaseNum}`}
                    </Text>
                  </>
                ) : (
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    letterSpacing="widest"
                    textTransform="uppercase"
                    color={metaColor}
                  >
                    Unassigned
                  </Text>
                )}
              </VStack>
              <Text fontSize="xs" color={subtitleColor}>
                {group.items.length} {group.items.length === 1 ? 'piece' : 'pieces'}
              </Text>
            </HStack>
          </Box>

          {/* Sortable list */}
          <Box
            borderWidth="1px"
            borderTopWidth={0}
            borderColor={borderColor}
            borderBottomRadius="md"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, group.key)}
            >
              <SortableContext
                items={group.items.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {group.items.map(item => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    onEdit={onEdit}
                    onDetail={onDetail}
                    borderColor={borderColor}
                    metaColor={metaColor}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {group.items.length === 0 && (
              <Box px={4} py={3}>
                <HStack gap={2} color={metaColor}>
                  <IconFileText size={14} />
                  <Text fontSize="sm">No pieces in this series yet.</Text>
                </HStack>
              </Box>
            )}
          </Box>
        </Box>
      ))}
    </VStack>
  )
}

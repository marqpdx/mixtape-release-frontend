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
  Button,
  Input,
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
import { IconGripVertical, IconPencil, IconFileText, IconCheck, IconPlus, IconBook } from '@tabler/icons-react'
import { toaster } from '@mixtape/core/lib/toaster'
import * as writingApi from '@mixtape/api/clients/writing/writingApi'
import type { FlattenedPlacement, WorkingDocument, WritingSeries } from '@mixtape/core/types/writingTypes'

// ─── Unified item type ─────────────────────────────────────────────────────

interface SeriesItem {
  id: string
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

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ─── Health badge row ──────────────────────────────────────────────────────

function HealthBadges({ items }: { items: SeriesItem[] }) {
  const published = items.filter(i => i.status === 'published').length
  const scheduled = items.filter(i => i.status === 'scheduled').length
  const drafts    = items.filter(i => i.status === 'draft').length
  return (
    <HStack gap={1}>
      {published > 0 && (
        <Badge size="xs" colorPalette="green" variant="subtle">{published} pub</Badge>
      )}
      {scheduled > 0 && (
        <Badge size="xs" colorPalette="blue" variant="subtle">{scheduled} sched</Badge>
      )}
      {drafts > 0 && (
        <Badge size="xs" colorPalette="gray" variant="subtle">{drafts} draft</Badge>
      )}
    </HStack>
  )
}

// ─── Sortable row ──────────────────────────────────────────────────────────

function SortableRow({
  item,
  allSeries,
  onEdit,
  onDetail,
  onPromote,
  onChangeSeries,
  borderColor,
  metaColor,
}: {
  item: SeriesItem
  allSeries?: WritingSeries[]
  onEdit: (pieceId: string) => void
  onDetail?: (pieceSlug: string) => void
  onPromote?: (piece: { slug: string; title: string }) => void
  onChangeSeries?: (pieceId: string, seriesId: string | null) => void
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

        {/* Series assignment selector */}
        {allSeries && onChangeSeries && (
          <select
            value={item.seriesId ?? ''}
            onChange={(e) => {
              const val = e.target.value
              onChangeSeries(item.pieceId, val === '' ? null : val)
            }}
            style={{
              fontSize: '0.7rem',
              background: 'transparent',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '1px 4px',
              cursor: 'pointer',
              maxWidth: '100px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">Unassigned</option>
            {allSeries.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        )}

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
          {onPromote && (
            <Box
              as="button"
              p={1}
              color={metaColor}
              _hover={{ color: 'inherit' }}
              onClick={() => onPromote({ slug: item.pieceSlug, title: item.title })}
              title="Make Living Book"
            >
              <IconBook size={14} />
            </Box>
          )}
        </HStack>
      </HStack>
    </Box>
  )
}

// ─── Inline series creation form ───────────────────────────────────────────

function CreateSeriesForm({
  groupId,
  onCreated,
}: {
  groupId: string
  onCreated: (series: WritingSeries) => void
}) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const series = await writingApi.createWritingSeries({
        title: trimmed,
        slug: slugify(trimmed),
        phase_num: null,
        group: groupId,
      })
      onCreated(series)
      setTitle('')
    } catch {
      toaster.create({ title: 'Could not create series', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <HStack gap={2} pt={2}>
      <Input
        size="sm"
        placeholder="New series title…"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') void handleCreate() }}
        flex={1}
      />
      <Button
        size="sm"
        variant="outline"
        colorPalette="blue"
        loading={saving}
        disabled={!title.trim()}
        onClick={() => void handleCreate()}
      >
        <IconPlus size={14} />
        Add series
      </Button>
    </HStack>
  )
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface SeriesGroupViewProps {
  placements: FlattenedPlacement[]
  drafts: WorkingDocument[]
  onEdit: (pieceId: string) => void
  onDetail?: (pieceSlug: string) => void
  onPromote?: (piece: { slug: string; title: string }) => void
  /** Group UUID — enables inline series creation */
  groupId?: string
  /** Full series list for assignment dropdowns */
  allSeries?: WritingSeries[]
  /**
   * Phase A filter from the left rail.
   * undefined = show all, null = show only unassigned, string = show that series ID.
   */
  filterSeriesKey?: string | null
  /** Called after a new series is created inline */
  onSeriesCreated?: (series: WritingSeries) => void
  /** Called after a piece is reassigned to a different series */
  onRefresh?: () => void
}

// ─── Main component ────────────────────────────────────────────────────────

export function SeriesGroupView({
  placements,
  drafts,
  onEdit,
  onDetail,
  onPromote,
  groupId,
  allSeries,
  filterSeriesKey,
  onSeriesCreated,
  onRefresh,
}: SeriesGroupViewProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const sectionLabelColor = useColorModeValue('blue.600', 'blue.300')
  const metaColor = useColorModeValue('gray.500', 'gray.400')
  const headerBg = useColorModeValue('gray.50', 'gray.800')

  const [saving, setSaving] = useState(false)

  // Build unified list, deduplicate by pieceId (published wins over draft view)
  const allItems = useMemo(() => {
    const seen = new Set<string>()
    const items: SeriesItem[] = []

    for (const p of placements) {
      if (!seen.has(p.piece_id)) {
        seen.add(p.piece_id)
        items.push(placementToItem(p))
      }
    }

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

  // Apply Phase A filter
  const visibleGroups = useMemo(() => {
    if (filterSeriesKey === undefined) return seriesGroups
    return seriesGroups.filter(g => g.key === filterSeriesKey)
  }, [seriesGroups, filterSeriesKey])

  // Local reorder state per series
  const [localGroups, setLocalGroups] = useState<typeof seriesGroups | null>(null)
  const groups = (localGroups ?? visibleGroups)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(async (event: DragEndEvent, groupKey: string | null) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const baseGroups = localGroups ?? visibleGroups
    const targetGroup = baseGroups.find(g => g.key === groupKey)
    if (!targetGroup) return

    const oldIndex = targetGroup.items.findIndex(i => i.id === active.id)
    const newIndex = targetGroup.items.findIndex(i => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(targetGroup.items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      seriesOrder: idx,
    }))

    setLocalGroups(prev => {
      const base = prev ?? visibleGroups
      return base.map(g => g.key === groupKey ? { ...g, items: reordered } : g)
    })

    setSaving(true)
    try {
      await Promise.all(
        reordered.map((item, idx) =>
          writingApi.updatePiece(item.pieceId, { series_order: idx })
        )
      )
    } catch {
      toaster.create({ title: 'Could not save order', type: 'error' })
      setLocalGroups(null)
    } finally {
      setSaving(false)
    }
  }, [localGroups, visibleGroups])

  const handleChangeSeries = useCallback(async (pieceId: string, seriesId: string | null) => {
    setSaving(true)
    try {
      await writingApi.updatePiece(pieceId, { series: seriesId })
      setLocalGroups(null) // reset optimistic state; parent refetch will update
      onRefresh?.()
    } catch {
      toaster.create({ title: 'Could not reassign piece', type: 'error' })
    } finally {
      setSaving(false)
    }
  }, [onRefresh])

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
          <Text>Saving…</Text>
        </HStack>
      )}

      {groups.map(group => (
        <Box key={group.key ?? '__unassigned__'}>
          {/* Series header */}
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
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    letterSpacing="widest"
                    textTransform="uppercase"
                    color={sectionLabelColor}
                  >
                    {group.title ?? `Phase ${group.phaseNum}`}
                  </Text>
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
              <HStack gap={2}>
                <HealthBadges items={group.items} />
                <Text fontSize="xs" color={metaColor}>
                  {group.items.length} {group.items.length === 1 ? 'piece' : 'pieces'}
                </Text>
              </HStack>
            </HStack>
          </Box>

          {/* Sortable piece list */}
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
                    allSeries={allSeries}
                    onEdit={onEdit}
                    onDetail={onDetail}
                    onPromote={onPromote}
                    onChangeSeries={allSeries ? handleChangeSeries : undefined}
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

      {/* Inline series creation — only when groupId provided */}
      {groupId && (
        <CreateSeriesForm
          groupId={groupId}
          onCreated={(series) => {
            onSeriesCreated?.(series)
            onRefresh?.()
          }}
        />
      )}
    </VStack>
  )
}

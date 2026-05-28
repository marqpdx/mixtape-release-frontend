// src/components/writing/SeriesWritingWorkArea.tsx
//
// Option D — Series Writing work area.
// A dedicated, full-width space for series-centric editing.
// Always in series-rail mode: left nav + piece list. No tab switching.
//
// Access: admin / superuser only (gated at GroupWorkArea level).

'use client'

import { useMemo, useState } from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Heading,
  Spinner,
} from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as writingApi from '@mixtape/api/clients/writing/writingApi'
import { useWriting } from '@hooks/useWriting'
import { SeriesGroupView } from './SeriesGroupView'
import type { WritingSeries, FlattenedPlacement, WorkingDocument } from '@mixtape/core/types/writingTypes'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Sponsor {
  type: 'group'
  id: string
  slug: string
  displayName: string
}

interface SeriesWritingWorkAreaProps {
  sponsor: Sponsor
  onNavigateToEditor: (pieceId?: string) => void
  onNavigateToDetail: (piece: { id: string; slug: string }) => void
}

// ─── Rail item ─────────────────────────────────────────────────────────────

function RailItem({
  label,
  count,
  active,
  muted,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  muted?: boolean
  onClick: () => void
}) {
  const activeBg = useColorModeValue('blue.50', 'blue.900')
  const hoverBg = useColorModeValue('gray.50', 'gray.750')

  return (
    <Box
      px={3}
      py={2}
      borderRadius="md"
      cursor="pointer"
      bg={active ? activeBg : undefined}
      _hover={{ bg: active ? activeBg : hoverBg }}
      onClick={onClick}
    >
      <HStack justify="space-between">
        <Text
          fontSize="sm"
          fontWeight={active ? 'semibold' : 'normal'}
          color={muted ? 'gray.500' : undefined}
          lineClamp={1}
        >
          {label}
        </Text>
        <Badge size="xs" colorPalette={active ? 'blue' : 'gray'} variant="subtle">
          {count}
        </Badge>
      </HStack>
    </Box>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export default function SeriesWritingWorkArea({
  sponsor,
  onNavigateToEditor,
  onNavigateToDetail,
}: SeriesWritingWorkAreaProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const railBg = useColorModeValue('gray.50', 'gray.850')

  const [selectedSeriesKey, setSelectedSeriesKey] = useState<string | null | undefined>(undefined)
  const queryClient = useQueryClient()

  // ── Data ────────────────────────────────────────────────────────────────

  const { data: seriesList = [], isLoading: seriesLoading } = useQuery<WritingSeries[]>({
    queryKey: ['writing', 'series', sponsor.slug],
    queryFn: () => writingApi.fetchWritingSeries(sponsor.slug),
  })

  const {
    placements,
    drafts,
    isLoading: writingLoading,
  } = useWriting(sponsor.type, sponsor.slug)

  const typedPlacements = useMemo(() => (placements ?? []) as FlattenedPlacement[], [placements])
  const typedDrafts = useMemo(() => (Array.isArray(drafts) ? drafts : []) as WorkingDocument[], [drafts])

  // ── Per-series counts for rail ───────────────────────────────────────────

  const seriesCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of typedPlacements) {
      const key = p.series_id ?? '__unassigned__'
      counts[key] = (counts[key] ?? 0) + 1
    }
    for (const d of typedDrafts) {
      const key = d.piece.series_id ?? '__unassigned__'
      // only count drafts not already counted as placements
      const alreadyCounted = typedPlacements.some(p => p.piece_id === d.piece.id)
      if (!alreadyCounted) {
        counts[key] = (counts[key] ?? 0) + 1
      }
    }
    return counts
  }, [typedPlacements, typedDrafts])

  const totalCount = typedPlacements.length + typedDrafts.filter(
    d => !typedPlacements.some(p => p.piece_id === d.piece.id)
  ).length

  const unassignedCount = seriesCounts['__unassigned__'] ?? 0

  // ── Invalidation helpers ─────────────────────────────────────────────────

  const refreshWriting = () => {
    void queryClient.invalidateQueries({ queryKey: ['writing', 'placements', sponsor.type, sponsor.slug] })
    void queryClient.invalidateQueries({ queryKey: ['writing', 'drafts', sponsor.type, sponsor.slug] })
  }

  const refreshSeries = () => {
    void queryClient.invalidateQueries({ queryKey: ['writing', 'series', sponsor.slug] })
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (writingLoading || seriesLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner />
      </Box>
    )
  }

  return (
    <Box h="full" display="flex" flexDir="column" gap={0}>
      {/* Header */}
      <Box px={6} py={4} borderBottomWidth="1px" borderColor={borderColor}>
        <HStack justify="space-between">
          <Heading size="md">Series Writing</Heading>
          <Text fontSize="sm" color="gray.500">
            {sponsor.displayName}
          </Text>
        </HStack>
      </Box>

      {/* Body */}
      <HStack align="start" flex={1} gap={0} overflow="hidden">

        {/* Left rail */}
        <Box
          w="220px"
          flexShrink={0}
          h="full"
          overflowY="auto"
          bg={railBg}
          borderRightWidth="1px"
          borderColor={borderColor}
          px={2}
          py={3}
        >
          <VStack align="stretch" gap={0}>
            <RailItem
              label="All pieces"
              count={totalCount}
              active={selectedSeriesKey === undefined}
              onClick={() => setSelectedSeriesKey(undefined)}
            />

            {seriesList.map(s => (
              <RailItem
                key={s.id}
                label={s.title}
                count={seriesCounts[s.id] ?? 0}
                active={selectedSeriesKey === s.id}
                onClick={() => setSelectedSeriesKey(s.id)}
              />
            ))}

            {unassignedCount > 0 && (
              <RailItem
                label="Unassigned"
                count={unassignedCount}
                active={selectedSeriesKey === null}
                muted
                onClick={() => setSelectedSeriesKey(null)}
              />
            )}
          </VStack>
        </Box>

        {/* Main panel */}
        <Box flex={1} h="full" overflowY="auto" px={6} py={4}>
          {selectedSeriesKey !== undefined && (
            <Text fontSize="sm" fontWeight="semibold" color="gray.500" mb={4}>
              {selectedSeriesKey === null
                ? 'Unassigned'
                : seriesList.find(s => s.id === selectedSeriesKey)?.title ?? 'Series'}
            </Text>
          )}

          <SeriesGroupView
            placements={typedPlacements}
            drafts={typedDrafts}
            onEdit={onNavigateToEditor}
            onDetail={(slug) => onNavigateToDetail({ id: '', slug })}
            groupId={sponsor.id}
            allSeries={seriesList}
            filterSeriesKey={selectedSeriesKey}
            onSeriesCreated={refreshSeries}
            onRefresh={refreshWriting}
          />
        </Box>
      </HStack>
    </Box>
  )
}

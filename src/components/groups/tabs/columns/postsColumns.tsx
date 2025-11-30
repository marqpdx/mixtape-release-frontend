// src/components/groups/tabs/columns/postsColumns.tsx

import { createColumnHelper, ColumnDef } from '@tanstack/react-table'
import { HStack, VStack, Text, Badge, Box } from '@chakra-ui/react'
import { formatDistanceToNow } from 'date-fns'
import { useColorModeValue } from '@components/ui/color-mode'
import { FlattenedPlacement } from '@/types/writingTypes'

const columnHelper = createColumnHelper<FlattenedPlacement>()

export const postsColumns = (onRowClick?: (placement: FlattenedPlacement) => void): ColumnDef<FlattenedPlacement>[] => [
  columnHelper.display({
    id: 'post_info',
    header: 'Posts',
    cell: ({ row }) => {
      const placement = row.original
      const bgHover = useColorModeValue('gray.50', 'gray.700')

      return (
        <Box
          cursor={onRowClick ? 'pointer' : 'default'}
          onClick={() => onRowClick?.(placement)}
          _hover={onRowClick ? { bg: bgHover } : {}}
          px={3}
          mx={-3}
          py={2}
          rounded="md"
          transition="all 0.2s"
        >
          <VStack align="start" gap={1} flex={1}>
            <HStack gap={2}>
              <Text fontWeight="semibold" fontSize="md" lineClamp={1}>
                {placement.piece_title}
              </Text>
              {placement.is_pinned && (
                <Badge colorScheme="green" fontSize="xs">Pinned</Badge>
              )}
              {placement.is_announcement && (
                <Badge colorScheme="blue" fontSize="xs">Announcement</Badge>
              )}
            </HStack>

            {placement.display?.excerpt && (
              <Text fontSize="sm" color="gray.600" lineClamp={2}>
                {placement.display.excerpt}
              </Text>
            )}

            <VStack gap={1} align="start" fontSize="xs" color="gray.500">
              <Text>
                By {placement.author_name} • Published {formatDistanceToNow(new Date(placement.published_at), { addSuffix: true })}
              </Text>
              <Text>
                Visibility: {placement.visibility === 'public' ? '🌍 Public' : '👥 Members Only'}
              </Text>
            </VStack>
          </VStack>
        </Box>
      )
    },
  }),
]
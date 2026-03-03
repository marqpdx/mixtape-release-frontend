// src/components/groups/tabs/columns/postsColumns.tsx

import { createColumnHelper, ColumnDef } from '@tanstack/react-table'
import { HStack, VStack, Text, Badge, Box, IconButton, Wrap, WrapItem } from '@chakra-ui/react'
import { formatDistanceToNow } from 'date-fns'
import { FlattenedPlacement } from '@mixtape/core/types/writingTypes'
import { IconEdit } from '@tabler/icons-react'
import Image from 'next/image'

const columnHelper = createColumnHelper<FlattenedPlacement>()

// Create a separate component for the cell content so we can use hooks
function PostCell({
  placement,
  onRowClick,
  onEdit
}: {
  placement: FlattenedPlacement;
  onRowClick?: (placement: FlattenedPlacement) => void
  onEdit?: (placement: FlattenedPlacement) => void
}) {
  // Now we can use hooks here since this is a proper React component
  // However, for hover colors, we can use Chakra's _dark pseudo-prop instead

  return (
    <Box
      cursor={onRowClick ? 'pointer' : 'default'}
      onClick={() => onRowClick?.(placement)}
      _hover={onRowClick ? {
        bg: { base: 'gray.50', _dark: 'gray.700' }
      } : {}}
      px={3}
      mx={-3}
      py={2}
      rounded="md"
      transition="all 0.2s"
    >
      <HStack align="start" gap={3}>
        {placement.sponsor_image_url ? (
          <Box
            w="32px"
            h="32px"
            borderRadius="sm"
            overflow="hidden"
            borderWidth="1px"
            borderColor="gray.200"
            bg="gray.100"
            flexShrink={0}
          >
            <Image
              src={placement.sponsor_image_url}
              alt={placement.sponsor_label || "Sponsor"}
              width={32}
              height={32}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </Box>
        ) : null}

        <VStack align="start" gap={1} flex={1}>
          <HStack gap={2} w="full" justify="space-between">
            <HStack gap={2} minW={0} flex={1}>
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
            {onEdit && (
              <IconButton
                aria-label="Edit"
                size="sm"
                variant="ghost"
                colorScheme="green"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit(placement)
                }}
              >
                <IconEdit size={16} />
              </IconButton>
            )}
          </HStack>

          {placement.display?.excerpt && (
            <Text fontSize="sm" color="gray.600" lineClamp={2}>
              {placement.display.excerpt}
            </Text>
          )}

          {placement.tags && placement.tags.length > 0 && (
            <Wrap gap={2}>
              {placement.tags.map((tag) => (
                <WrapItem key={tag}>
                  <Badge size="sm" variant="subtle" colorScheme="gray">
                    {tag}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
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
      </HStack>
    </Box>
  )
}

export const postsColumns = (
  onRowClick?: (placement: FlattenedPlacement) => void,
  onEdit?: (placement: FlattenedPlacement) => void
): ColumnDef<FlattenedPlacement>[] => [
  columnHelper.display({
    id: 'post_info',
    header: 'Posts',
    cell: ({ row }) => (
      <PostCell placement={row.original} onRowClick={onRowClick} onEdit={onEdit} />
    ),
  }),
]

// // src/components/groups/tabs/columns/postsColumns.tsx

// import { createColumnHelper, ColumnDef } from '@tanstack/react-table'
// import { HStack, VStack, Text, Badge, Box } from '@chakra-ui/react'
// import { formatDistanceToNow } from 'date-fns'
// import { useColorModeValue } from '@components/ui/color-mode'
// import { FlattenedPlacement } from '@mixtape/core/types/writingTypes'

// const columnHelper = createColumnHelper<FlattenedPlacement>()

// export const postsColumns = (onRowClick?: (placement: FlattenedPlacement) => void): ColumnDef<FlattenedPlacement>[] => [
//   columnHelper.display({
//     id: 'post_info',
//     header: 'Posts',
//     cell: ({ row }) => {
//       const placement = row.original
//       const bgHover = useColorModeValue('gray.50', 'gray.700')

//       return (
//         <Box
//           cursor={onRowClick ? 'pointer' : 'default'}
//           onClick={() => onRowClick?.(placement)}
//           _hover={onRowClick ? { bg: bgHover } : {}}
//           px={3}
//           mx={-3}
//           py={2}
//           rounded="md"
//           transition="all 0.2s"
//         >
//           <VStack align="start" gap={1} flex={1}>
//             <HStack gap={2}>
//               <Text fontWeight="semibold" fontSize="md" lineClamp={1}>
//                 {placement.piece_title}
//               </Text>
//               {placement.is_pinned && (
//                 <Badge colorScheme="green" fontSize="xs">Pinned</Badge>
//               )}
//               {placement.is_announcement && (
//                 <Badge colorScheme="blue" fontSize="xs">Announcement</Badge>
//               )}
//             </HStack>

//             {placement.display?.excerpt && (
//               <Text fontSize="sm" color="gray.600" lineClamp={2}>
//                 {placement.display.excerpt}
//               </Text>
//             )}

//             <VStack gap={1} align="start" fontSize="xs" color="gray.500">
//               <Text>
//                 By {placement.author_name} • Published {formatDistanceToNow(new Date(placement.published_at), { addSuffix: true })}
//               </Text>
//               <Text>
//                 Visibility: {placement.visibility === 'public' ? '🌍 Public' : '👥 Members Only'}
//               </Text>
//             </VStack>
//           </VStack>
//         </Box>
//       )
//     },
//   }),
// ]

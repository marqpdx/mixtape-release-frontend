// src/components/writing/WritingPieceDetailView.tsx

'use client'

import {
  VStack,
  Box,
  Container,
  Heading,
  Text,
  Button,
  HStack,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import Link from 'next/link'
import { IconArrowLeft, IconClock, IconEye } from '@tabler/icons-react'
import { formatDistanceToNow } from 'date-fns'

// Import hooks
import { useGroup } from '@/hooks/groups/useGroups'
import { useWritingPiece } from '@hooks/useWriting'

// Import your headers for continuity
import { GroupMemberHeader } from '@components/groups/headers/GroupMemberHeader'
import { GroupPublicHeader } from '@components/groups/headers/GroupPublicHeader'
import { Divider } from '@components/common/Divider'
import { TipTapRenderer } from '@components/tiptap/TipTapRenderer'

interface WritingPieceDetailViewProps {
  groupSlug: string
  pieceSlug: string
}

export function WritingPieceDetailView({ groupSlug, pieceSlug }: WritingPieceDetailViewProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')

  // Use hooks instead of direct API calls
  const { group, isLoading: groupLoading } = useGroup(groupSlug)
  const { piece, isLoading: pieceLoading, error } = useWritingPiece(pieceSlug)

  const isLoading = groupLoading || pieceLoading
  const isMember = group?.is_member || false
  const viewingAsMember = isMember

  if (isLoading || !group) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Skeleton h="200px" mb={8} />
        <Container maxW="3xl">
          <VStack gap={4} align="stretch">
            <Skeleton h="10" />
            <SkeletonText noOfLines={5} />
          </VStack>
        </Container>
      </Box>
    )
  }

  if (error || !piece) {
    return (
      <Box bg={bgColor} minH="100vh">
        {/* Show header for context */}
        {viewingAsMember ? (
          <GroupMemberHeader group={group} />
        ) : (
          <GroupPublicHeader group={group} />
        )}

        <Container maxW="3xl" py={12}>
          <VStack align="center" gap={4}>
            <Heading size="md">Piece not found</Heading>
            <Text color="gray.500">
              This piece may have been deleted or you don't have permission to view it.
            </Text>
            <Button>
              <Link href={`/groups/${groupSlug}`}>
                <HStack>
                  <IconArrowLeft size={16} />
                  <Text>Back to {group?.title || 'group'}</Text>
                </HStack>
              </Link>
            </Button>
          </VStack>
        </Container>
      </Box>
    )
  }

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Headers for continuity */}
      {viewingAsMember ? (
        <GroupMemberHeader group={group} />
      ) : (
        <GroupPublicHeader group={group} />
      )}

      {/* Main content */}
      <Container maxW="3xl" py={0} px={{ base: 4, md: 8 }}>
        <VStack gap={4} align="stretch">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            justifyContent="flex-start"
            w="fit-content"
          >
            <Link href={`/groups/${groupSlug}`}>
              <HStack>
                <IconArrowLeft size={16} />
                <Text>Back to {group?.title}</Text>
              </HStack>
            </Link>
          </Button>

          {/* Article container */}
          <Box bg={cardBg} borderRadius="lg" borderWidth="1px" p={8}>
            <VStack gap={6} align="stretch">
              {/* Title and metadata */}
              <VStack gap={3} align="stretch">
                <Heading size="2xl">{piece.title}</Heading>

                <HStack
                  gap={4}
                  flexWrap="wrap"
                  fontSize="sm"
                  color="gray.600"
                >
                  <HStack gap={1}>
                    <Text fontWeight="medium">{piece.author_name}</Text>
                  </HStack>
                  <Text>•</Text>
                  <Text>
                    {formatDistanceToNow(new Date(piece.published_at), {
                      addSuffix: true,
                    })}
                  </Text>

                  {piece.reading_time && (
                    <>
                      <Text>•</Text>
                      <HStack gap={1}>
                        <IconClock size={14} />
                        <Text>{piece.reading_time} min read</Text>
                      </HStack>
                    </>
                  )}
                </HStack>

                {/* View count */}
                {piece.view_count > 0 && (
                  <HStack gap={1} fontSize="xs" color="gray.500">
                    <IconEye size={14} />
                    <Text>{piece.view_count} views</Text>
                  </HStack>
                )}
              </VStack>

              <Divider />

              {/* Excerpt if available */}
              {piece.excerpt && (
                <Text fontSize="lg" color="gray.600" fontStyle="italic">
                  {piece.excerpt}
                </Text>
              )}

              <Divider />

              {/* Main content */}
              <Box className="writing-piece-content">
                <TipTapRenderer content={piece.body_json} />
              </Box>

              <Divider />

              {/* Footer metadata */}
              <HStack
                justify="space-between"
                fontSize="sm"
                color="gray.500"
                pt={4}
              >
                <Text>
                  {piece.writing_kind.charAt(0).toUpperCase() +
                    piece.writing_kind.slice(1)}
                </Text>
                {piece.allow_comments && (
                  <Text>Comments enabled</Text>
                )}
              </HStack>
            </VStack>
          </Box>

          {/* Related/Next actions */}
          <VStack gap={3} align="stretch" pt={4}>
            <Button
              colorScheme="blue"
              variant="outline"
              justifyContent="center"
            >
              <Link href={`/groups/${groupSlug}`}>
                <HStack>
                  <IconArrowLeft size={16} />
                  <Text>Back to {group?.title}</Text>
                </HStack>
              </Link>
            </Button>
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}
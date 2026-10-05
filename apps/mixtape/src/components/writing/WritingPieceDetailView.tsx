// src/components/writing/WritingPieceDetailView.tsx

'use client'

import { Suspense, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import Link from 'next/link'
import { IconArrowLeft, IconBook, IconClock, IconPencil } from '@tabler/icons-react'
import { format } from 'date-fns'

import { useGroup } from '@mixtape/api/hooks/groups/useGroups'
import { useGroupPermissions } from '@mixtape/api/hooks/groups/useGroupSectionPermissions'
import { useWritingPiece } from '@hooks/useWriting'
import { GroupMemberHeader } from '@components/groups/headers/GroupMemberHeader'
import { GroupPublicHeader } from '@components/groups/headers/GroupPublicHeader'
import { TipTapRenderer } from '@components/tiptap/TipTapRenderer'
import type { TipTapDocument } from '@components/tiptap/TipTapRenderer'
import { LivingBookBreadcrumb } from '@components/living-book/LivingBookBreadcrumb'
import { ContextFlowPanel } from '@components/living-book/ContextFlowPanel'
import { PromotionDialog } from '@components/living-book/PromotionDialog'

interface WritingPieceDetailViewProps {
  groupSlug: string
  pieceSlug: string
}

export function WritingPieceDetailView({ groupSlug, pieceSlug }: WritingPieceDetailViewProps) {
  const pageBg = useColorModeValue('white', 'gray.900')
  const metaColor = useColorModeValue('gray.500', 'gray.400')
  const excerptColor = useColorModeValue('gray.600', 'gray.300')
  const seriesColor = useColorModeValue('blue.600', 'blue.300')
  const dividerColor = useColorModeValue('gray.200', 'gray.700')

  const [promotionOpen, setPromotionOpen] = useState(false)

  const { group, isLoading: groupLoading } = useGroup(groupSlug)
  const { isAdmin, hasDecorator } = useGroupPermissions(groupSlug)
  const { piece, isLoading: pieceLoading, error } = useWritingPiece(pieceSlug)

  const isLoading = groupLoading || pieceLoading
  const isMember = group?.is_member || false
  const canEdit = isAdmin || hasDecorator('can__ManageWriting')

  if (isLoading || !group) {
    return (
      <Box bg={pageBg} minH="100vh">
        <Skeleton h="64px" mb={0} />
        <Container maxW="680px" py={12} px={{ base: 5, md: 8 }}>
          <Skeleton h="8" mb={4} w="60%" />
          <Skeleton h="12" mb={6} />
          <SkeletonText lineClamp={8} gap={3} />
        </Container>
      </Box>
    )
  }

  if (error || !piece) {
    return (
      <Box bg={pageBg} minH="100vh">
        {isMember ? <GroupMemberHeader group={group} /> : <GroupPublicHeader group={group} />}
        <Container maxW="680px" py={16} px={{ base: 5, md: 8 }} textAlign="center">
          <Text color={metaColor} mb={4}>This article could not be found.</Text>
          <Link href={`/groups/${groupSlug}`} style={{ color: 'inherit' }}>
            <HStack gap={1} justify="center">
              <IconArrowLeft size={14} />
              <Text fontSize="sm">Back to {group?.title}</Text>
            </HStack>
          </Link>
        </Container>
      </Box>
    )
  }

  const publishedDate = piece.published_at
    ? format(new Date(piece.published_at), 'MMMM d, yyyy')
    : null

  return (
    <Box bg={pageBg} minH="100vh">
      {isMember ? <GroupMemberHeader group={group} /> : <GroupPublicHeader group={group} />}

      <Container maxW="680px" py={10} px={{ base: 5, md: 8 }}>

        {/* Nav row */}
        <HStack justify="space-between" mb={8}>
          <Link href={`/groups/${groupSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            <HStack gap={1} color={metaColor} _hover={{ color: 'inherit' }}>
              <IconArrowLeft size={15} />
              <Text fontSize="sm">{group.title}</Text>
            </HStack>
          </Link>
          {canEdit && piece?.id && (
            <HStack gap={4}>
              <Link
                href={`/groups/${groupSlug}?view=admin&section=write&piece=${piece.id}`}
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                <HStack gap={1} color={metaColor} _hover={{ color: 'inherit' }}>
                  <IconPencil size={14} />
                  <Text fontSize="sm">Edit</Text>
                </HStack>
              </Link>
              <HStack
                gap={1}
                color={metaColor}
                cursor="pointer"
                _hover={{ color: 'inherit' }}
                onClick={() => setPromotionOpen(true)}
              >
                <IconBook size={14} />
                <Text fontSize="sm">Make Living Book</Text>
              </HStack>
            </HStack>
          )}
        </HStack>

        {/* LB breadcrumb + prev/next (shows only when ?lb= is present) */}
        {piece?.id && (
          <Suspense>
            <LivingBookBreadcrumb pieceSlug={pieceSlug} pieceId={piece.id} groupSlug={groupSlug} />
          </Suspense>
        )}

        {/* Series breadcrumb */}
        {piece.series && (
          <Text fontSize="sm" fontWeight="medium" color={seriesColor} mb={3} letterSpacing="wide">
            {piece.series.title}
            {piece.series_order != null && (
              <Text as="span" fontWeight="normal" color={metaColor}> · {piece.series_order}</Text>
            )}
          </Text>
        )}

        {/* Title */}
        <Heading
          as="h1"
          size="3xl"
          lineHeight="1.15"
          fontWeight="bold"
          letterSpacing="-0.02em"
          mb={4}
        >
          {piece.title}
        </Heading>

        {/* Meta line */}
        <HStack gap={2} fontSize="sm" color={metaColor} mb={6} flexWrap="wrap">
          {piece.author_name && <Text>{piece.author_name}</Text>}
          {publishedDate && (
            <>
              <Text>·</Text>
              <Text>{publishedDate}</Text>
            </>
          )}
          {piece.reading_time != null && piece.reading_time > 0 && (
            <>
              <Text>·</Text>
              <HStack gap={1}>
                <IconClock size={13} />
                <Text>{piece.reading_time} min read</Text>
              </HStack>
            </>
          )}
        </HStack>

        {/* Excerpt as lede */}
        {piece.excerpt && (
          <>
            <Text
              fontSize="xl"
              lineHeight="1.6"
              color={excerptColor}
              mb={6}
            >
              {piece.excerpt}
            </Text>
            <Box borderTopWidth="1px" borderColor={dividerColor} mb={8} />
          </>
        )}

        {/* Body */}
        <Box
          fontSize="md"
          lineHeight="1.85"
          css={{
            '& p + p:not(.ttr-code-paragraph)': { marginTop: '1.25em' },
          }}
        >
          <TipTapRenderer content={piece.body_json as TipTapDocument} />
        </Box>

        {/* Footer nav */}
        <Box borderTopWidth="1px" borderColor={dividerColor} mt={12} pt={6}>
          <Link href={`/groups/${groupSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            <HStack gap={1} color={metaColor} _hover={{ color: 'inherit' }}>
              <IconArrowLeft size={15} />
              <Text fontSize="sm">Back to {group.title}</Text>
            </HStack>
          </Link>
        </Box>

        {/* LB context flow panel (shows only when ?lb= is present) */}
        {piece?.id && (
          <Suspense>
            <ContextFlowPanel pieceSlug={pieceSlug} pieceId={piece.id} groupSlug={groupSlug} />
          </Suspense>
        )}

      </Container>

      {canEdit && piece && (
        <PromotionDialog
          pieceSlug={pieceSlug}
          pieceTitle={piece.title}
          open={promotionOpen}
          onClose={() => setPromotionOpen(false)}
          groupSlug={groupSlug}
        />
      )}
    </Box>
  )
}

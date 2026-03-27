// src/components/writing/GroupWritingCatalog.tsx

'use client'

import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  VStack,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import Link from 'next/link'
import { IconArrowLeft, IconClock } from '@tabler/icons-react'
import { format } from 'date-fns'

import { useGroup } from '@mixtape/api/hooks/groups/useGroups'
import { useGroupWritingCatalog } from '@hooks/useWriting'
import { GroupMemberHeader } from '@components/groups/headers/GroupMemberHeader'
import { GroupPublicHeader } from '@components/groups/headers/GroupPublicHeader'
import type { WritingPieceCatalogItem, WritingSeries } from '@mixtape/core/types/writingTypes'

interface GroupWritingCatalogProps {
  groupSlug: string
}

interface SeriesGroup {
  series: WritingSeries | null
  pieces: WritingPieceCatalogItem[]
}

function groupBySeries(pieces: WritingPieceCatalogItem[]): SeriesGroup[] {
  const order: Array<string | null> = []
  const map = new Map<string | null, WritingPieceCatalogItem[]>()

  for (const piece of pieces) {
    const key = piece.series?.id ?? null
    if (!map.has(key)) {
      map.set(key, [])
      order.push(key)
    }
    map.get(key)!.push(piece)
  }

  return order.map((key) => ({
    series: key ? pieces.find((p) => p.series?.id === key)?.series ?? null : null,
    pieces: map.get(key)!,
  }))
}

function ArticleCard({
  piece,
  groupSlug,
  borderColor,
  metaColor,
  excerptColor,
}: {
  piece: WritingPieceCatalogItem
  groupSlug: string
  borderColor: string
  metaColor: string
  excerptColor: string
}) {
  const publishedDate = piece.published_at
    ? format(new Date(piece.published_at), 'MMM d, yyyy')
    : null

  return (
    <Link
      href={`/groups/${groupSlug}/writing/${piece.slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
    <Box
      py={5}
      borderBottomWidth="1px"
      borderColor={borderColor}
    >
      <Heading
        as="h3"
        size="md"
        fontWeight="semibold"
        lineHeight="1.3"
        mb={piece.excerpt ? 2 : 0}
      >
        {piece.title}
      </Heading>

      {piece.excerpt && (
        <Text fontSize="sm" color={excerptColor} lineHeight="1.6" mb={2} lineClamp={2}>
          {piece.excerpt}
        </Text>
      )}

      <HStack gap={2} fontSize="xs" color={metaColor} flexWrap="wrap">
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
              <IconClock size={11} />
              <Text>{piece.reading_time} min</Text>
            </HStack>
          </>
        )}
      </HStack>
    </Box>
    </Link>
  )
}

export function GroupWritingCatalog({ groupSlug }: GroupWritingCatalogProps) {
  const pageBg = useColorModeValue('white', 'gray.900')
  const metaColor = useColorModeValue('gray.500', 'gray.400')
  const excerptColor = useColorModeValue('gray.600', 'gray.300')
  const sectionLabelColor = useColorModeValue('blue.600', 'blue.300')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const subtitleColor = useColorModeValue('gray.500', 'gray.400')

  const { group, isLoading: groupLoading } = useGroup(groupSlug)
  const { pieces, isLoading: catalogLoading } = useGroupWritingCatalog(groupSlug)

  const isLoading = groupLoading || catalogLoading
  const isMember = group?.is_member || false

  if (isLoading || !group) {
    return (
      <Box bg={pageBg} minH="100vh">
        <Skeleton h="64px" mb={0} />
        <Container maxW="680px" py={12} px={{ base: 5, md: 8 }}>
          <Skeleton h="6" mb={8} w="40%" />
          {[0, 1, 2].map((i) => (
            <Box key={i} mb={8}>
              <Skeleton h="5" mb={3} w="30%" />
              <SkeletonText lineClamp={4} gap={3} />
            </Box>
          ))}
        </Container>
      </Box>
    )
  }

  const seriesGroups = groupBySeries(pieces)
  const namedGroups = seriesGroups.filter((g) => g.series !== null)
  const uncategorized = seriesGroups.find((g) => g.series === null)

  return (
    <Box bg={pageBg} minH="100vh">
      {isMember ? <GroupMemberHeader group={group} /> : <GroupPublicHeader group={group} />}

      <Container maxW="680px" py={10} px={{ base: 5, md: 8 }}>

        {/* Nav */}
        <HStack mb={10}>
          <Link href={`/groups/${groupSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            <HStack gap={1} color={metaColor} _hover={{ color: 'inherit' }}>
              <IconArrowLeft size={15} />
              <Text fontSize="sm">{group.title}</Text>
            </HStack>
          </Link>
        </HStack>

        {pieces.length === 0 ? (
          <Text color={metaColor}>No published pieces yet.</Text>
        ) : (
          <VStack align="stretch" gap={12}>
            {namedGroups.map(({ series, pieces: sectionPieces }) => (
              <Box key={series!.id}>
                {/* Section header */}
                <Box mb={5}>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    letterSpacing="widest"
                    textTransform="uppercase"
                    color={sectionLabelColor}
                    mb={series!.subtitle ? 1 : 0}
                  >
                    {series!.title}
                  </Text>
                  {series!.subtitle && (
                    <Text fontSize="sm" color={subtitleColor}>
                      {series!.subtitle}
                    </Text>
                  )}
                </Box>

                {/* Articles */}
                <Box borderTopWidth="1px" borderColor={borderColor}>
                  {sectionPieces.map((piece) => (
                    <ArticleCard
                      key={piece.id}
                      piece={piece}
                      groupSlug={groupSlug}
                      borderColor={borderColor}
                      metaColor={metaColor}
                      excerptColor={excerptColor}
                    />
                  ))}
                </Box>
              </Box>
            ))}

            {/* Uncategorized */}
            {uncategorized && uncategorized.pieces.length > 0 && (
              <Box>
                <Box mb={5}>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    letterSpacing="widest"
                    textTransform="uppercase"
                    color={metaColor}
                  >
                    More
                  </Text>
                </Box>
                <Box borderTopWidth="1px" borderColor={borderColor}>
                  {uncategorized.pieces.map((piece) => (
                    <ArticleCard
                      key={piece.id}
                      piece={piece}
                      groupSlug={groupSlug}
                      borderColor={borderColor}
                      metaColor={metaColor}
                      excerptColor={excerptColor}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </VStack>
        )}

      </Container>
    </Box>
  )
}

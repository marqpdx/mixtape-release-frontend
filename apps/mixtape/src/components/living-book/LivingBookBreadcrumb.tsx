"use client"

// LB-7: Breadcrumb + Prev/Next for pieces viewed inside a Living Book
// Reads `?lb=<livingBookId>` from the URL. Shows nothing if not in a living book context.

import { HStack, Text, Box, IconButton } from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { IconChevronLeft, IconChevronRight, IconBookmark } from "@tabler/icons-react"
import { useLivingBook, useContextNeighbors } from "@hooks/useLivingBook"

interface LivingBookBreadcrumbProps {
  pieceSlug: string
  pieceId: string
  username?: string
  groupSlug?: string
}

export function LivingBookBreadcrumb({ pieceId, username, groupSlug }: LivingBookBreadcrumbProps) {
  const searchParams = useSearchParams()
  const livingBookId = searchParams.get("lb")

  const { data: book } = useLivingBook(livingBookId)
  const { data: neighbors } = useContextNeighbors(livingBookId, pieceId)

  const borderColor = useColorModeValue("gray.200", "gray.700")
  const bgColor = useColorModeValue("gray.50", "gray.800")
  const mutedColor = useColorModeValue("gray.500", "gray.400")
  const textColor = useColorModeValue("gray.700", "gray.300")

  if (!livingBookId || !book) return null

  const makePieceHref = (slug: string) =>
    groupSlug
      ? `/groups/${groupSlug}/writing/${slug}?lb=${livingBookId}`
      : username
      ? `/member/${username}/writing/${slug}?lb=${livingBookId}`
      : `#`

  return (
    <Box
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      bg={bgColor}
      px={3}
      py={2}
      mb={4}
    >
      <HStack gap={2} justify="space-between" flexWrap="wrap">
        <HStack gap={1} minW={0}>
          <Box color={mutedColor} flexShrink={0}>
            <IconBookmark size={14} />
          </Box>
          <Link href={`/living-books/${livingBookId}/`}>
            <Text fontSize="xs" color={mutedColor} lineClamp={1}>
              {book.title}
            </Text>
          </Link>
        </HStack>

        <HStack gap={1} flexShrink={0}>
          {neighbors?.prev ? (
            <Link href={makePieceHref(neighbors.prev.slug)} title={neighbors.prev.title}>
              <IconButton
                aria-label={`Previous: ${neighbors.prev.title}`}
                size="xs"
                variant="ghost"
              >
                <IconChevronLeft size={14} />
              </IconButton>
            </Link>
          ) : (
            <IconButton aria-label="No previous" size="xs" variant="ghost" disabled>
              <IconChevronLeft size={14} />
            </IconButton>
          )}

          <Text fontSize="xs" color={mutedColor} px={1}>
            {neighbors?.prev || neighbors?.next ? (
              <>
                {neighbors.prev && (
                  <Text as="span" lineClamp={1} maxW="120px" display="inline-block">
                    {neighbors.prev.title}
                  </Text>
                )}
                {neighbors.prev && neighbors.next && (
                  <Text as="span" mx={1} color={mutedColor}>
                    ·
                  </Text>
                )}
                {neighbors.next && (
                  <Text as="span" lineClamp={1} maxW="120px" display="inline-block">
                    {neighbors.next.title}
                  </Text>
                )}
              </>
            ) : null}
          </Text>

          {neighbors?.next ? (
            <Link href={makePieceHref(neighbors.next.slug)} title={neighbors.next.title}>
              <IconButton
                aria-label={`Next: ${neighbors.next.title}`}
                size="xs"
                variant="ghost"
              >
                <IconChevronRight size={14} />
              </IconButton>
            </Link>
          ) : (
            <IconButton aria-label="No next" size="xs" variant="ghost" disabled>
              <IconChevronRight size={14} />
            </IconButton>
          )}
        </HStack>
      </HStack>

      {neighbors?.next && (
        <Text fontSize="xs" color={mutedColor} mt={1} lineClamp={1}>
          Next:{" "}
          <Link href={makePieceHref(neighbors.next.slug)}>
            <Text as="span" color={textColor}>
              {neighbors.next.title}
            </Text>
          </Link>
        </Text>
      )}
    </Box>
  )
}

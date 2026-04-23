"use client"

// LB-8: Context Flow Mode — carousel showing preceding and following nodes
// Default layout for Living Book nodes; collapsible.

import { useState } from "react"
import {
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
} from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react"
import { useLivingBook, useContextNeighbors } from "@hooks/useLivingBook"

interface ContextFlowPanelProps {
  pieceSlug: string
  username?: string
}

interface ContextCardProps {
  title: string
  excerpt: string
  href: string
  direction: "prev" | "next"
}

function ContextCard({ title, excerpt, href, direction }: ContextCardProps) {
  const borderColor = useColorModeValue("gray.200", "gray.700")
  const cardBg = useColorModeValue("gray.50", "gray.800")
  const mutedColor = useColorModeValue("gray.500", "gray.400")
  const labelColor = useColorModeValue("gray.400", "gray.500")

  return (
    <Link href={href} style={{ flex: 1 }}>
      <Box
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        bg={cardBg}
        px={4}
        py={3}
        _hover={{ borderColor: "blue.300" }}
        transition="border-color 0.15s"
        h="full"
        minH="80px"
      >
        <HStack gap={2} mb={1}>
          {direction === "prev" && <IconChevronLeft size={12} color="currentColor" />}
          <Text fontSize="xs" color={labelColor} textTransform="uppercase" letterSpacing="wide">
            {direction === "prev" ? "Previous" : "Next"}
          </Text>
          {direction === "next" && <IconChevronRight size={12} color="currentColor" />}
        </HStack>
        <Text fontSize="sm" fontWeight="semibold" lineClamp={2} mb={1}>
          {title}
        </Text>
        {excerpt && (
          <Text fontSize="xs" color={mutedColor} lineClamp={3}>
            {excerpt}
          </Text>
        )}
      </Box>
    </Link>
  )
}

export function ContextFlowPanel({ pieceSlug, username }: ContextFlowPanelProps) {
  const searchParams = useSearchParams()
  const livingBookId = searchParams.get("lb")
  const [collapsed, setCollapsed] = useState(false)

  const { data: book } = useLivingBook(livingBookId)
  const { data: neighbors, isLoading } = useContextNeighbors(livingBookId, pieceSlug)

  const borderColor = useColorModeValue("gray.200", "gray.700")
  const headerBg = useColorModeValue("gray.50", "gray.850")
  const mutedColor = useColorModeValue("gray.400", "gray.500")

  if (!livingBookId || !book) return null
  if (!isLoading && !neighbors?.prev && !neighbors?.next) return null

  const makePieceHref = (slug: string) =>
    username
      ? `/member/${username}/writing/${slug}?lb=${livingBookId}`
      : `#`

  return (
    <Box
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      mt={6}
    >
      <HStack
        px={3}
        py={2}
        bg={headerBg}
        borderBottom={collapsed ? "none" : "1px solid"}
        borderColor={borderColor}
        cursor="pointer"
        onClick={() => setCollapsed((c) => !c)}
        userSelect="none"
      >
        <Text fontSize="xs" color={mutedColor} textTransform="uppercase" letterSpacing="wide">
          Continue in {book.title}
        </Text>
        <IconButton
          aria-label={collapsed ? "Expand context flow" : "Collapse context flow"}
          size="xs"
          variant="ghost"
          ml="auto"
        >
          {collapsed ? <IconChevronDown size={12} /> : <IconChevronUp size={12} />}
        </IconButton>
      </HStack>

      {!collapsed && (
        <Box px={3} py={3}>
          {isLoading ? (
            <Text fontSize="sm" color={mutedColor}>
              Loading…
            </Text>
          ) : (
            <HStack gap={3} align="stretch">
              {neighbors?.prev && (
                <ContextCard
                  title={neighbors.prev.title}
                  excerpt={neighbors.prev.excerpt}
                  href={makePieceHref(neighbors.prev.slug)}
                  direction="prev"
                />
              )}
              {!neighbors?.prev && neighbors?.next && <Box flex={1} />}

              {neighbors?.next && (
                <ContextCard
                  title={neighbors.next.title}
                  excerpt={neighbors.next.excerpt}
                  href={makePieceHref(neighbors.next.slug)}
                  direction="next"
                />
              )}
              {!neighbors?.next && neighbors?.prev && <Box flex={1} />}
            </HStack>
          )}
        </Box>
      )}
    </Box>
  )
}

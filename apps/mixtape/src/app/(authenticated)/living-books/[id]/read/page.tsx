"use client"

// LB-9: Accumulated Read View — flat DFS render, section headings, anchor TOC
// Published-only for readers; editors see all with draft indicators.

import { useState } from "react"
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Skeleton,
  SkeletonText,
  Divider,
} from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"
import Link from "next/link"
import { useParams } from "next/navigation"
import { IconArrowLeft, IconList } from "@tabler/icons-react"
import { useAuth } from "@/lib/auth/AuthContext"
import { useLivingBook, useLivingBookAccumulated } from "@hooks/useLivingBook"
import { TipTapRenderer } from "@components/tiptap/TipTapRenderer"

export default function AccumulatedReadPage() {
  const params = useParams()
  const id = params?.id as string
  const [tocOpen, setTocOpen] = useState(true)

  const { user: identity } = useAuth()
  const { data: book, isLoading: bookLoading } = useLivingBook(id)
  const { data: nodes = [], isLoading: nodesLoading } = useLivingBookAccumulated(id)

  const bgColor = useColorModeValue("gray.50", "gray.900")
  const cardBg = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.700")
  const mutedColor = useColorModeValue("gray.500", "gray.400")
  const draftColor = useColorModeValue("orange.500", "orange.300")
  const tocBg = useColorModeValue("gray.50", "gray.800")
  const tocBorder = useColorModeValue("gray.200", "gray.700")

  const isEditor = Boolean(
    identity &&
      book &&
      (identity.is_superuser || identity.username === book.created_by)
  )

  const visibleNodes = isEditor ? nodes : nodes.filter((n) => n.is_published)
  const isLoading = bookLoading || nodesLoading

  const totalWords = visibleNodes.reduce((sum, n) => sum + (n.word_count || 0), 0)

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="3xl" py={8}>
        <VStack gap={6} align="stretch">
          <HStack gap={2}>
            <Link href={`/living-books/${id}/`}>
              <Button size="sm" variant="ghost" gap={1}>
                <IconArrowLeft size={14} />
                {isLoading ? "Living Book" : (book?.title ?? "Living Book")}
              </Button>
            </Link>
          </HStack>

          {isLoading ? (
            <VStack gap={4} align="stretch">
              <Skeleton h="32px" w="50%" />
              <SkeletonText lineClamp={3} />
            </VStack>
          ) : (
            <>
              <Box>
                <Heading size="xl" mb={2}>
                  {book?.title}
                </Heading>
                {book?.description && (
                  <Text color={mutedColor} mb={2}>
                    {book.description}
                  </Text>
                )}
                <Text fontSize="sm" color={mutedColor}>
                  {visibleNodes.length}{" "}
                  {visibleNodes.length === 1 ? "piece" : "pieces"} ·{" "}
                  {totalWords.toLocaleString()} words
                </Text>
              </Box>

              {visibleNodes.length > 1 && (
                <Box
                  border="1px solid"
                  borderColor={tocBorder}
                  borderRadius="lg"
                  bg={tocBg}
                  overflow="hidden"
                >
                  <HStack
                    px={4}
                    py={2}
                    cursor="pointer"
                    onClick={() => setTocOpen((o) => !o)}
                    userSelect="none"
                  >
                    <IconList size={14} />
                    <Text fontSize="sm" fontWeight="semibold">
                      Contents
                    </Text>
                    <Text fontSize="xs" color={mutedColor} ml="auto">
                      {tocOpen ? "Hide" : "Show"}
                    </Text>
                  </HStack>
                  {tocOpen && (
                    <Box
                      borderTop="1px solid"
                      borderColor={tocBorder}
                      px={4}
                      py={3}
                    >
                      <VStack gap={1} align="stretch">
                        {visibleNodes.map((node, idx) => (
                          <HStack key={node.piece_id} gap={2}>
                            <Text
                              fontSize="xs"
                              color={mutedColor}
                              w="20px"
                              flexShrink={0}
                            >
                              {idx + 1}
                            </Text>
                            <a href={`#section-${node.piece_slug}`} style={{ flex: 1 }}>
                              <Text
                                fontSize="sm"
                                pl={`${node.depth * 12}px`}
                                lineClamp={1}
                                color={!node.is_published && isEditor ? draftColor : undefined}
                              >
                                {node.title || "Untitled"}
                                {!node.is_published && isEditor && (
                                  <Text as="span" fontSize="xs" ml={1} opacity={0.7}>
                                    draft
                                  </Text>
                                )}
                              </Text>
                            </a>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </Box>
              )}

              <VStack gap={10} align="stretch">
                {visibleNodes.map((node, idx) => (
                  <Box
                    key={node.piece_id}
                    id={`section-${node.piece_slug}`}
                    bg={cardBg}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="xl"
                    p={6}
                  >
                    <VStack gap={4} align="stretch">
                      <HStack gap={2} align="baseline">
                        <Text fontSize="xs" color={mutedColor} w="20px" flexShrink={0}>
                          {idx + 1}
                        </Text>
                        <VStack gap={0} align="start" flex={1} minW={0}>
                          <Heading
                            size="md"
                            color={
                              !node.is_published && isEditor ? draftColor : undefined
                            }
                          >
                            {node.title || "Untitled"}
                          </Heading>
                          {!node.is_published && isEditor && (
                            <Text fontSize="xs" color={draftColor}>
                              draft — not visible to readers
                            </Text>
                          )}
                        </VStack>
                      </HStack>

                      {node.body ? (
                        <Box pl="28px">
                          <TipTapRenderer content={node.body} />
                        </Box>
                      ) : (
                        <Text fontSize="sm" color={mutedColor} pl="28px">
                          No content yet.
                        </Text>
                      )}

                      <HStack gap={3} pl="28px" pt={1}>
                        <Text fontSize="xs" color={mutedColor}>
                          {(node.word_count || 0).toLocaleString()} words
                        </Text>
                        <Link
                          href={`/member/${book?.created_by}/writing/${node.piece_slug}?lb=${id}`}
                        >
                          <Text fontSize="xs" color="blue.400">
                            Open piece →
                          </Text>
                        </Link>
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </VStack>

              {visibleNodes.length === 0 && (
                <Text color={mutedColor} textAlign="center" py={8}>
                  {isEditor
                    ? "No nodes in this Living Book yet."
                    : "No published pieces in this Living Book yet."}
                </Text>
              )}
            </>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

"use client"

// Phase 3 amendment to ADR-0054 (P3-4): Issue Continuous Read view.
// Flat render of an Issue's ordered placements + its description intro,
// generalized from Living Books' Accumulated Read view (LB-9).
// Editor (sponsor owner or superuser) sees drafts inline; reader sees
// published-only — split enforced server-side by IssueReadView.

import { useState } from "react"
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Badge,
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"
import Link from "next/link"
import { useParams } from "next/navigation"
import { IconArrowLeft, IconList } from "@tabler/icons-react"
import { useIssueRead } from "@mixtape/api/hooks/useIssueBoard"
import { TipTapRenderer } from "@components/tiptap/TipTapRenderer"

export default function IssueContinuousReadPage() {
  const params = useParams()
  const issueId = params?.issueId as string
  const [tocOpen, setTocOpen] = useState(true)

  const { data: issue, isLoading } = useIssueRead(issueId)

  const bgColor = useColorModeValue("gray.50", "gray.900")
  const cardBg = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.700")
  const mutedColor = useColorModeValue("gray.500", "gray.400")
  const draftColor = useColorModeValue("orange.500", "orange.300")
  const tocBg = useColorModeValue("gray.50", "gray.800")
  const tocBorder = useColorModeValue("gray.200", "gray.700")
  const introBg = useColorModeValue("blue.50", "blue.950")
  const introBorder = useColorModeValue("blue.100", "blue.900")

  const placements = issue?.placements ?? []
  const isEditor = Boolean(issue?.is_editor)
  const totalWords = placements.reduce((sum, p) => sum + (p.word_count || 0), 0)

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="3xl" py={8}>
        <VStack gap={6} align="stretch">
          <HStack gap={2}>
            <Link href="/dashboard">
              <Button size="sm" variant="ghost" gap={1}>
                <IconArrowLeft size={14} />
                {isLoading ? "Issue" : (issue?.title ?? "Issue")}
              </Button>
            </Link>
          </HStack>

          {isLoading ? (
            <VStack gap={4} align="stretch">
              <Skeleton h="32px" w="50%" />
              <SkeletonText lineClamp={3} />
            </VStack>
          ) : !issue ? (
            <Text color={mutedColor} textAlign="center" py={16}>
              Issue not found.
            </Text>
          ) : (
            <>
              <Box>
                <HStack gap={2} mb={2}>
                  {issue.designation && (
                    <Badge colorPalette="blue" size="sm">{issue.designation}</Badge>
                  )}
                  {issue.status === "published" && (
                    <Badge colorPalette="blue" size="sm" variant="outline">Published</Badge>
                  )}
                </HStack>
                <Heading size="xl" mb={2}>
                  {issue.title}
                </Heading>
                <Text fontSize="sm" color={mutedColor}>
                  {placements.length}{" "}
                  {placements.length === 1 ? "piece" : "pieces"} ·{" "}
                  {totalWords.toLocaleString()} words
                </Text>
              </Box>

              {/* Issue-native welcome/intro — description does not create a WritingPiece */}
              {issue.description && (
                <Box
                  bg={introBg}
                  border="1px solid"
                  borderColor={introBorder}
                  borderRadius="xl"
                  p={6}
                >
                  <TipTapRenderer content={issue.description} />
                </Box>
              )}

              {placements.length > 1 && (
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
                    <Box borderTop="1px solid" borderColor={tocBorder} px={4} py={3}>
                      <VStack gap={1} align="stretch">
                        {placements.map((p, idx) => (
                          <HStack key={p.id} gap={2}>
                            <Text fontSize="xs" color={mutedColor} w="20px" flexShrink={0}>
                              {idx + 1}
                            </Text>
                            <a href={`#section-${p.slug}`} style={{ flex: 1 }}>
                              <Text
                                fontSize="sm"
                                fontWeight={p.is_lead ? "semibold" : "normal"}
                                lineClamp={1}
                                color={p.status !== "published" && isEditor ? draftColor : undefined}
                              >
                                {p.title || "Untitled"}
                                {p.status !== "published" && isEditor && (
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
                {placements.map((p, idx) => (
                  <Box
                    key={p.id}
                    id={`section-${p.slug}`}
                    bg={cardBg}
                    border="1px solid"
                    borderColor={p.is_lead ? "blue.300" : borderColor}
                    borderRadius="xl"
                    p={6}
                  >
                    <VStack gap={4} align="stretch">
                      <HStack gap={2} align="baseline">
                        <Text fontSize="xs" color={mutedColor} w="20px" flexShrink={0}>
                          {idx + 1}
                        </Text>
                        <VStack gap={0} align="start" flex={1} minW={0}>
                          <HStack gap={2}>
                            <Heading
                              size={p.is_lead ? "lg" : "md"}
                              color={p.status !== "published" && isEditor ? draftColor : undefined}
                            >
                              {p.title || "Untitled"}
                            </Heading>
                            {p.is_lead && (
                              <Badge size="xs" colorPalette="blue">Lead</Badge>
                            )}
                          </HStack>
                          {p.status !== "published" && isEditor && (
                            <Text fontSize="xs" color={draftColor}>
                              draft — not visible to readers
                            </Text>
                          )}
                        </VStack>
                      </HStack>

                      {p.body_json ? (
                        <Box pl="28px">
                          <TipTapRenderer content={p.body_json} />
                        </Box>
                      ) : (
                        <Text fontSize="sm" color={mutedColor} pl="28px">
                          No content yet.
                        </Text>
                      )}

                      <HStack gap={3} pl="28px" pt={1}>
                        <Text fontSize="xs" color={mutedColor}>
                          {(p.word_count || 0).toLocaleString()} words
                        </Text>
                        <Link href={`/writing/${p.slug}`}>
                          <Text fontSize="xs" color="blue.400">
                            Open piece →
                          </Text>
                        </Link>
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </VStack>

              {placements.length === 0 && (
                <Text color={mutedColor} textAlign="center" py={8}>
                  {isEditor
                    ? "No pieces in this Issue yet."
                    : "No published pieces in this Issue yet."}
                </Text>
              )}
            </>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

"use client"

// LB-4: Living Book Page — title, description, contributors, structure, launch accumulated read

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
} from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"
import Link from "next/link"
import { useParams } from "next/navigation"
import { IconBook, IconArrowLeft, IconList } from "@tabler/icons-react"
import { useAuth } from "@/lib/auth/AuthContext"
import { useLivingBook, useLivingBookTree } from "@hooks/useLivingBook"
import { useGroupPermissions } from "@mixtape/api/hooks/groups/useGroupSectionPermissions"
import { StructurePanel } from "@components/living-book/StructurePanel"

export default function LivingBookPage() {
  const params = useParams()
  const id = params?.id as string

  const { user: identity } = useAuth()
  const { data: book, isLoading: bookLoading, error: bookError } = useLivingBook(id)
  const { data: nodes = [], isLoading: treeLoading } = useLivingBookTree(id)
  const { isAdmin: isGroupAdmin } = useGroupPermissions(book?.group_slug || "")

  const bgColor = useColorModeValue("gray.50", "gray.900")
  const cardBg = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.700")
  const mutedColor = useColorModeValue("gray.500", "gray.400")
  const iconColor = useColorModeValue("blue.500", "blue.300")

  const isEditor = Boolean(
    identity &&
      book &&
      (identity.is_superuser || (book.sponsor_type === "group" && isGroupAdmin))
  )

  const publishedCount = nodes.filter((n) => n.is_published).length
  const totalCount = nodes.length
  const maxDepth = nodes.reduce((max, n) => Math.max(max, n.depth), 0)

  const isLoading = bookLoading || treeLoading

  if (bookError) {
    return (
      <Box bg={bgColor} minH="100vh" py={12}>
        <Container maxW="3xl">
          <Text color="red.500">Could not load this Living Book.</Text>
        </Container>
      </Box>
    )
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="3xl" py={8}>
        <VStack gap={6} align="stretch">
          <HStack gap={2}>
            <Link href="/">
              <Button size="sm" variant="ghost" gap={1}>
                <IconArrowLeft size={14} />
                Back
              </Button>
            </Link>
          </HStack>

          {isLoading ? (
            <VStack gap={4} align="stretch">
              <Skeleton h="40px" w="60%" />
              <SkeletonText lineClamp={2} />
            </VStack>
          ) : (
            <Box
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="xl"
              p={6}
            >
              <VStack gap={4} align="stretch">
                <HStack gap={3}>
                  <Box color={iconColor}>
                    <IconBook size={24} />
                  </Box>
                  <VStack gap={0} align="start" flex={1} minW={0}>
                    <Heading size="lg" lineClamp={2}>
                      {book?.title}
                    </Heading>
                    {book?.status === "draft" && (
                      <Text fontSize="xs" color="orange.400">
                        draft
                      </Text>
                    )}
                  </VStack>
                </HStack>

                {book?.description && (
                  <Text color={mutedColor} fontSize="sm">
                    {book.description}
                  </Text>
                )}

                <HStack gap={4} pt={1} flexWrap="wrap">
                  <Text fontSize="sm" color={mutedColor}>
                    <Text as="span" fontWeight="semibold" color="inherit">
                      {totalCount}
                    </Text>{" "}
                    {totalCount === 1 ? "piece" : "pieces"}
                    {isEditor && totalCount !== publishedCount && (
                      <Text as="span">
                        {" "}
                        ({publishedCount} published)
                      </Text>
                    )}
                  </Text>
                  {maxDepth > 0 && (
                    <Text fontSize="sm" color={mutedColor}>
                      <Text as="span" fontWeight="semibold" color="inherit">
                        {maxDepth + 1}
                      </Text>{" "}
                      levels deep
                    </Text>
                  )}
                </HStack>

                <HStack gap={3} pt={2} flexWrap="wrap">
                  <Link href={`/living-books/${id}/read/`}>
                    <Button colorPalette="blue" size="sm" gap={2}>
                      <IconList size={14} />
                      Accumulated Read
                    </Button>
                  </Link>
                  {book?.trunk_slug && (
                    <Link
                      href={
                        book.sponsor_type === "group" && book.group_slug
                          ? `/groups/${book.group_slug}/writing/${book.trunk_slug}?lb=${id}`
                          : `/living-books/${id}/`
                      }
                    >
                      <Button size="sm" variant="outline" gap={2}>
                        Open Trunk Piece
                      </Button>
                    </Link>
                  )}
                </HStack>
              </VStack>
            </Box>
          )}

          {!isLoading && (
            <StructurePanel
              livingBookId={id}
              isEditor={isEditor}
              groupSlug={book?.group_slug ?? undefined}
            />
          )}
        </VStack>
      </Container>
    </Box>
  )
}

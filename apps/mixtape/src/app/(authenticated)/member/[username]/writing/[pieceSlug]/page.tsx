// apps/mixtape/src/app/(authenticated)/member/[username]/writing/[pieceSlug]/page.tsx

"use client"

import { useEffect, useRef, useState } from "react"
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
} from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"
import Link from "next/link"
import { useParams } from "next/navigation"
import { IconArrowLeft, IconClock, IconEye } from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"

import { useAuth } from "@/lib/auth/AuthContext"
import { useMemberProfile } from "@hooks/member/useMemberProfile"
import { useWritingPiece } from "@hooks/useWriting"
import ProfileHeaderWrapper from "@components/profiles/ProfileHeaderWrapper"
import { Divider } from "@components/common/Divider"
import { TipTapRenderer } from "@components/tiptap/TipTapRenderer"
import { axiosInstance } from "@mixtape/api/lib/axiosInstance"
import { DartOverlay } from "@components/reading/DartOverlay"

interface AffirmedMarker {
  id: string
  raw_name: string
  label: string
  body: string
  char_offset: number
}

export default function MemberWritingPiecePage() {
  const params = useParams()
  const usernameParam = params?.username as string
  const pieceSlug = params?.pieceSlug as string

  const bgColor = useColorModeValue("gray.50", "gray.900")
  const cardBg = useColorModeValue("white", "gray.800")
  const mutedColor = useColorModeValue("gray.500", "gray.400")
  const markerBg = useColorModeValue("gray.50", "gray.900")
  const markerBorder = useColorModeValue("gray.200", "gray.700")

  const [affirmedMarkers, setAffirmedMarkers] = useState<AffirmedMarker[]>([])
  const articleRef = useRef<HTMLElement | null>(null)

  const { user: identity, isLoading: identityLoading } = useAuth()
  const username = usernameParam || identity?.username
  const { member, isLoading: memberLoading } = useMemberProfile(username)
  const { piece, isLoading: pieceLoading, error } = useWritingPiece(pieceSlug)

  const isOwner = Boolean(
    identity && member && identity.username === member.username
  )
  const headerTitle = member?.display_name || member?.username || "Member"
  const headerSubtitle = member?.username ? `@${member.username}` : undefined
  const isLoading = identityLoading || memberLoading || pieceLoading

  const libraryUrl = `/members/${usernameParam}/library`

  useEffect(() => {
    if (!pieceSlug) return
    axiosInstance
      .get(`/api/atelier/${pieceSlug}/markers/?status=affirmed`)
      .then((res) => setAffirmedMarkers(res.data as AffirmedMarker[]))
      .catch(() => setAffirmedMarkers([]))
  }, [pieceSlug])

  if (isLoading) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Skeleton h="200px" mb={8} />
        <Container maxW="3xl">
          <VStack gap={4} align="stretch">
            <Skeleton h="10" />
            <SkeletonText lineClamp={5} />
          </VStack>
        </Container>
      </Box>
    )
  }

  if (error || !piece) {
    return (
      <Box bg={bgColor} minH="100vh">
        <ProfileHeaderWrapper
          mode={isOwner ? "self" : "public"}
          title={headerTitle}
          subtitle={headerSubtitle}
          bannerImageUrl={member?.background_image_url || null}
          avatarImageUrl={
            member?.profile_image_url || member?.avatar_url || null
          }
          avatarFallbackText={
            member?.display_name?.charAt(0) ||
            member?.username?.charAt(0) ||
            "?"
          }
        />
        <Container maxW="3xl" py={12}>
          <VStack align="center" gap={4}>
            <Heading size="md">Piece not found</Heading>
            <Text color="gray.500">
              This piece may have been deleted or you don&apos;t have permission
              to view it.
            </Text>
            <Button variant="outline">
              <Link href={libraryUrl}>
                <HStack>
                  <IconArrowLeft size={16} />
                  <Text>Back to Library</Text>
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
      <ProfileHeaderWrapper
        mode={isOwner ? "self" : "public"}
        title={headerTitle}
        subtitle={headerSubtitle}
        bannerImageUrl={member?.background_image_url || null}
        avatarImageUrl={
          member?.profile_image_url || member?.avatar_url || null
        }
        avatarFallbackText={
          member?.display_name?.charAt(0) ||
          member?.username?.charAt(0) ||
          "?"
        }
      />

      <Container maxW="3xl" py={0} px={{ base: 4, md: 8 }}>
        <VStack gap={4} align="stretch">
          {/* Back to library */}
          <Button
            variant="ghost"
            size="sm"
            justifyContent="flex-start"
            w="fit-content"
          >
            <Link href={libraryUrl}>
              <HStack>
                <IconArrowLeft size={16} />
                <Text>Back to Library</Text>
              </HStack>
            </Link>
          </Button>

          {/* Edit button for owner */}
          {isOwner && piece?.id && (
            <Button
              variant="outline"
              size="sm"
              justifyContent="flex-start"
              w="fit-content"
              colorScheme="green"
            >
              <Link
                href={`/member/${usernameParam}/hub?section=write&piece=${piece.id}`}
              >
                <HStack>
                  <Text>Edit</Text>
                </HStack>
              </Link>
            </Button>
          )}

          {/* Article container */}
          <Box bg={cardBg} borderRadius="lg" borderWidth="1px" p={8}>
            <VStack gap={6} align="stretch">
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
                  <Text>&bull;</Text>
                  <Text>
                    {formatDistanceToNow(new Date(piece.published_at), {
                      addSuffix: true,
                    })}
                  </Text>

                  {piece.reading_time && (
                    <>
                      <Text>&bull;</Text>
                      <HStack gap={1}>
                        <IconClock size={14} />
                        <Text>{piece.reading_time} min read</Text>
                      </HStack>
                    </>
                  )}
                </HStack>

                {piece.view_count > 0 && (
                  <HStack gap={1} fontSize="xs" color="gray.500">
                    <IconEye size={14} />
                    <Text>{piece.view_count} views</Text>
                  </HStack>
                )}
              </VStack>

              <Divider />

              {piece.excerpt && (
                <Text fontSize="lg" color="gray.600" fontStyle="italic">
                  {piece.excerpt}
                </Text>
              )}

              {piece.excerpt && <Divider />}

              <Box
                className="writing-piece-content"
                position="relative"
                ref={(el) => { articleRef.current = el }}
              >
                <TipTapRenderer content={piece.body_json} />
              </Box>

              {/* Affirmed marker anchors — navigation targets for cross-piece index */}
              {affirmedMarkers.length > 0 && (
                <>
                  <Divider />
                  <VStack align="stretch" gap={3}>
                    {affirmedMarkers.map((marker) => (
                      <Box
                        key={marker.id}
                        id={`marker-${marker.id}`}
                        borderLeftWidth="3px"
                        borderLeftColor="blue.300"
                        pl={4}
                        py={1}
                        bg={markerBg}
                        borderRadius="sm"
                      >
                        <HStack gap={2} mb={marker.body ? 1 : 0}>
                          <Box
                            px={1.5} py={0.5}
                            bg={markerBorder}
                            borderRadius="sm"
                            fontSize="xs"
                            fontFamily="mono"
                            color={mutedColor}
                          >
                            /{marker.raw_name}
                          </Box>
                          <Text fontSize="sm" fontWeight="medium">{marker.label}</Text>
                        </HStack>
                        {marker.body && (
                          <Text fontSize="sm" color={mutedColor} pl={6}>{marker.body}</Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </>
              )}

              <Divider />

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
                {piece.allow_comments && <Text>Comments enabled</Text>}
              </HStack>
            </VStack>
          </Box>

          {/* Bottom back link */}
          <VStack gap={3} align="stretch" pt={4}>
            <Button
              colorScheme="blue"
              variant="outline"
              justifyContent="center"
            >
              <Link href={libraryUrl}>
                <HStack>
                  <IconArrowLeft size={16} />
                  <Text>Back to Library</Text>
                </HStack>
              </Link>
            </Button>
          </VStack>
        </VStack>
      </Container>

      {piece && identity && (
        <DartOverlay
          artifactId={piece.id}
          articleRef={articleRef}
          isOwn={isOwner}
        />
      )}
    </Box>
  )
}

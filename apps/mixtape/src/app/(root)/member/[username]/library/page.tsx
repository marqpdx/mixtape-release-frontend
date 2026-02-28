// apps/mixtape/src/app/(root)/member/[username]/library/page.tsx

"use client"

import { useEffect, useCallback } from "react"
import { Box, Text } from "@chakra-ui/react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { useMemberProfile } from "@hooks/member/useMemberProfile"
import { useMemberLibrary } from "@mixtape/api/hooks/stackroom"
import ProfileHeaderWrapper from "@components/profiles/ProfileHeaderWrapper"
import LibraryPage from "@components/writing/library/LibraryPage"

export default function MemberLibraryPage() {
  const params = useParams()
  const usernameParam = params?.username as string | undefined

  const router = useRouter()
  const { user: identity, isLoading: identityLoading } = useAuth()
  const username = usernameParam || identity?.username
  const { member, isLoading: memberLoading } = useMemberProfile(username)

  const isOwner = Boolean(
    identity && member && identity.username === member.username
  )
  const headerTitle = member?.display_name || member?.username || "Member"
  const headerSubtitle = member?.username ? `@${member.username}` : undefined

  const {
    shelves,
    isLoading: libraryLoading,
    error: libraryError,
  } = useMemberLibrary(username, member?.id, isOwner)

  const handleItemClick = useCallback(
    (item: { url?: string }) => {
      if (item.url) {
        router.push(item.url)
      }
    },
    [router]
  )

  useEffect(() => {
    if (member) {
      document.title = `Library — ${headerTitle} - Mixtape Crossroads`
    }
  }, [member, headerTitle])

  if (identityLoading || memberLoading) {
    return <Text>Loading library...</Text>
  }

  if (!member) {
    return <Text>Member not found.</Text>
  }

  return (
    <Box>
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

      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={6}>
        <LibraryPage
          context="member"
          canManage={isOwner}
          shelves={shelves}
          isLoading={libraryLoading}
          error={libraryError ? "Failed to load library" : undefined}
          onItemClick={handleItemClick}
        />
      </Box>
    </Box>
  )
}

// src/components/threadworks/ActivityStream.tsx
// Flat unified feed across all forums. Forums as filter pills (hidden if only 1).
// Default sort: most recent activity. Alt sort: by name.

"use client"

import { useState, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  Badge, Box, Button, Flex, HStack, Spinner, Text, VStack,
} from '@chakra-ui/react'
import { useDisclosure } from '@chakra-ui/react'
import { IconPlus } from '@tabler/icons-react'
import { useColorModeValue } from '@components/ui/color-mode'
import {
  Forum, Discussion, FeedItem, FeedPost, CreateDiscussionData,
  getThreadworksUserDisplayName,
} from '@mixtape/core/types/threadworksTypes'
import { threadworksQueryKeys, useThreadworksMutations } from '@hooks/threadworks/useThreadworks'
import * as threadworksApi from '@mixtape/api/clients/threadworks/threadworksApi'
import { formatTimeAgo } from './threadworksUtils'
import DiscussionDetail from './DiscussionDetail'
import FeedPostItem from './FeedPostItem'
import FeedEntryPoint from './FeedEntryPoint'
import FeedPostComposer from './FeedPostComposer'
import CreateDiscussionModal from './CreateDiscussionModal'

type SortBy = 'activity' | 'name'

type TaggedFeedItem = FeedItem & {
  forumSlug: string
  forumTitle: string
}

interface ActivityStreamProps {
  forums: Forum[]
  groupSlug?: string
  isModerator?: boolean
  onDiscussionCreated?: () => void
}

export default function ActivityStream({
  forums,
  groupSlug,
  isModerator,
  onDiscussionCreated,
}: ActivityStreamProps) {
  const singleForum = forums.length === 1 ? forums[0] : null
  const [activeForumSlug, setActiveForumSlug] = useState<string>(
    singleForum ? singleForum.slug : 'all'
  )
  const [sortBy, setSortBy] = useState<SortBy>('activity')
  const [selectedItem, setSelectedItem] = useState<{ discussion: Discussion; forumSlug: string } | null>(null)
  const [showFeedPostComposer, setShowFeedPostComposer] = useState(false)
  const { open: discussionModalOpen, onOpen: openDiscussionModal, onClose: closeDiscussionModal } = useDisclosure()

  const mutations = useThreadworksMutations(groupSlug)
  const metaColor = useColorModeValue('gray.400', 'gray.500')
  const borderColor = useColorModeValue('gray.100', 'gray.700')
  const showForumPills = forums.length > 1

  // Parallel feed fetch for all forums
  const feedResults = useQueries({
    queries: forums.map((forum) => ({
      queryKey: threadworksQueryKeys.feed(forum.slug, {}),
      queryFn: () => threadworksApi.fetchForumFeed(forum.slug, groupSlug, {}),
      staleTime: 30_000,
    })),
  })

  const refetchAll = () => feedResults.forEach((r) => r.refetch())

  // Merge + tag all feed items, then sort
  const allItems = useMemo<TaggedFeedItem[]>(() => {
    const merged: TaggedFeedItem[] = []
    forums.forEach((forum, idx) => {
      const items = feedResults[idx]?.data?.results ?? []
      items.forEach((item) => merged.push({ ...item, forumSlug: forum.slug, forumTitle: forum.title }))
    })
    if (sortBy === 'name') {
      return merged.sort((a, b) => {
        const aTitle = (a.data as Discussion | FeedPost).title || ''
        const bTitle = (b.data as Discussion | FeedPost).title || ''
        return aTitle.localeCompare(bTitle)
      })
    }
    return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [feedResults, forums, sortBy])

  const visibleItems = useMemo<TaggedFeedItem[]>(() => {
    if (activeForumSlug === 'all') return allItems
    return allItems.filter((item) => item.forumSlug === activeForumSlug)
  }, [allItems, activeForumSlug])

  const isLoading = feedResults.some((r) => r.isLoading)
  const activeForumObj = forums.find((f) => f.slug === activeForumSlug)

  const handleCreateDiscussion = async (forumSlug: string, data: CreateDiscussionData) => {
    const targetSlug = forumSlug || singleForum?.slug || ''
    if (!targetSlug) return
    await mutations.createDiscussion(targetSlug, data)
    closeDiscussionModal()
    refetchAll()
    onDiscussionCreated?.()
  }

  if (selectedItem) {
    return (
      <DiscussionDetail
        discussion={selectedItem.discussion}
        forumSlug={selectedItem.forumSlug}
        groupSlug={groupSlug}
        isModerator={isModerator}
        onBack={() => setSelectedItem(null)}
      />
    )
  }

  return (
    <VStack align="stretch" gap={0}>
      {/* Top bar: pills + sort + new button */}
      <Flex justify="space-between" align="center" mb={4} gap={2} flexWrap="wrap">
        {showForumPills && (
          <HStack gap={1} flexWrap="wrap" flex={1}>
            <ForumPill label="All" active={activeForumSlug === 'all'} onClick={() => setActiveForumSlug('all')} />
            {forums.map((f) => (
              <ForumPill
                key={f.slug}
                label={f.title}
                active={activeForumSlug === f.slug}
                onClick={() => setActiveForumSlug(f.slug)}
              />
            ))}
          </HStack>
        )}
        <HStack gap={2} ml={showForumPills ? 0 : 'auto'}>
          <Button
            size="xs"
            variant="ghost"
            color={metaColor}
            onClick={() => setSortBy((s) => (s === 'activity' ? 'name' : 'activity'))}
          >
            {sortBy === 'activity' ? 'By activity' : 'By name'}
          </Button>
          <Button size="sm" colorScheme="green" onClick={openDiscussionModal}>
            <IconPlus size={16} />
            New Discussion
          </Button>
        </HStack>
      </Flex>

      {/* Entry point / FeedPost composer (only when a specific forum is active) */}
      {activeForumObj && (
        showFeedPostComposer ? (
          <Box mb={4}>
            <FeedPostComposer
              forumSlug={activeForumObj.slug}
              groupSlug={groupSlug}
              forum={activeForumObj}
              onCreated={() => { setShowFeedPostComposer(false); refetchAll() }}
              onCancel={() => setShowFeedPostComposer(false)}
            />
          </Box>
        ) : (
          <Box mb={4}>
            <FeedEntryPoint
              onStartDiscussion={openDiscussionModal}
              onCreatePost={() => setShowFeedPostComposer(true)}
            />
          </Box>
        )
      )}

      {/* Feed list */}
      {isLoading ? (
        <Flex justify="center" py={8}>
          <Spinner size="lg" color="green.500" />
        </Flex>
      ) : visibleItems.length === 0 ? (
        <Box py={8} textAlign="center">
          <Text color={metaColor} fontSize="sm">
            Nothing here yet. Start a discussion or post something.
          </Text>
        </Box>
      ) : (
        <VStack align="stretch" gap={2}>
          {visibleItems.map((item) => (
            <Box key={`${item.type}-${item.data.id}-${item.forumSlug}`}>
              {item.type === 'discussion' ? (
                <DiscussionCard
                  discussion={item.data as Discussion}
                  forumTitle={showForumPills && activeForumSlug === 'all' ? item.forumTitle : undefined}
                  onSelect={() =>
                    setSelectedItem({ discussion: item.data as Discussion, forumSlug: item.forumSlug })
                  }
                  borderColor={borderColor}
                  metaColor={metaColor}
                />
              ) : (
                <FeedPostItem feedPost={item.data as FeedPost} />
              )}
            </Box>
          ))}
        </VStack>
      )}

      <CreateDiscussionModal
        isOpen={discussionModalOpen}
        onClose={closeDiscussionModal}
        onSubmit={handleCreateDiscussion}
        isSubmitting={mutations.isCreatingDiscussion}
        forums={showForumPills ? forums : undefined}
        defaultForumSlug={activeForumSlug !== 'all' ? activeForumSlug : undefined}
      />
    </VStack>
  )
}

function ForumPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const activeBg = useColorModeValue('green.50', 'green.900')
  const activeColor = useColorModeValue('green.700', 'green.300')
  const idleColor = useColorModeValue('gray.500', 'gray.400')
  return (
    <Button
      size="xs"
      variant="ghost"
      bg={active ? activeBg : undefined}
      color={active ? activeColor : idleColor}
      fontWeight={active ? 'semibold' : 'normal'}
      onClick={onClick}
      borderRadius="full"
      px={3}
    >
      {label}
    </Button>
  )
}

function DiscussionCard({
  discussion,
  forumTitle,
  onSelect,
  borderColor,
  metaColor,
}: {
  discussion: Discussion
  forumTitle?: string
  onSelect: () => void
  borderColor: string
  metaColor: string
}) {
  const textColor = useColorModeValue('gray.700', 'gray.300')
  return (
    <Box
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
      cursor="pointer"
      onClick={onSelect}
      _hover={{ borderColor: 'green.300' }}
      transition="border-color 0.15s"
    >
      <Flex justify="space-between" align="flex-start" gap={2}>
        <VStack align="flex-start" gap={1} flex={1} minW={0}>
          <Text fontWeight="semibold" fontSize="sm" color={textColor} lineClamp={2}>
            {discussion.title}
          </Text>
          {discussion.description && (
            <Text fontSize="xs" color={metaColor} lineClamp={1}>
              {discussion.description}
            </Text>
          )}
          <HStack gap={3} mt={1} flexWrap="wrap">
            {forumTitle && (
              <Badge colorPalette="green" size="sm" variant="subtle">
                {forumTitle}
              </Badge>
            )}
            <Text fontSize="xs" color={metaColor}>
              {discussion.created_by ? getThreadworksUserDisplayName(discussion.created_by) : 'Unknown'}
            </Text>
            <Text fontSize="xs" color={metaColor}>
              {formatTimeAgo(discussion.created_at)}
            </Text>
            {discussion.post_count > 0 && (
              <Text fontSize="xs" color={metaColor}>
                {discussion.post_count} {discussion.post_count === 1 ? 'reply' : 'replies'}
              </Text>
            )}
          </HStack>
        </VStack>
        {discussion.resolution_post_id && (
          <Badge colorPalette="green" variant="subtle" size="sm" flexShrink={0}>
            Resolved
          </Badge>
        )}
      </Flex>
    </Box>
  )
}

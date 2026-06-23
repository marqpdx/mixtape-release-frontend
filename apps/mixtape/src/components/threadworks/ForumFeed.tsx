// src/components/threadworks/ForumFeed.tsx
// Unified feed for a Forum: Discussion + FeedPost items in reverse chronological order.
// Filter tabs: All | Discussions | Posts
// Temporal rhythm markers every N items (no infinite scroll — D spec).

import { useState } from 'react'
import {
  Box, Button, Flex, HStack, Heading, Spinner, Text, VStack, useDisclosure,
} from '@chakra-ui/react'
import { IconPlus } from '@tabler/icons-react'
import { useColorModeValue } from '@components/ui/color-mode'
import { Forum, Discussion, FeedItem } from '@mixtape/core/types/threadworksTypes'
import { useForumFeed } from '@hooks/threadworks/useThreadworks'
import { formatTimeAgo } from './threadworksUtils'
import DiscussionDetail from './DiscussionDetail'
import FeedPostItem from './FeedPostItem'
import FeedEntryPoint from './FeedEntryPoint'
import FeedPostComposer from './FeedPostComposer'
import CreateDiscussionModal from './CreateDiscussionModal'
import { useThreadworksMutations } from '@hooks/threadworks/useThreadworks'

type FeedFilter = 'all' | 'discussion' | 'feed_post'

interface ForumFeedProps {
  forum: Forum
  groupSlug?: string
  setActiveSection?: (section: string, params?: Record<string, string>) => void
}

const RHYTHM_INTERVAL = 8

export default function ForumFeed({ forum, groupSlug, setActiveSection }: ForumFeedProps) {
  void setActiveSection
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)
  const [showFeedPostComposer, setShowFeedPostComposer] = useState(false)
  const { open: discussionModalOpen, onOpen: openDiscussionModal, onClose: closeDiscussionModal } = useDisclosure()

  const textColor = useColorModeValue('gray.700', 'gray.300')
  const metaColor = useColorModeValue('gray.400', 'gray.500')
  const borderColor = useColorModeValue('gray.100', 'gray.700')
  const markerColor = useColorModeValue('gray.200', 'gray.700')
  const filterActiveBg = useColorModeValue('green.50', 'green.900')
  const filterActiveColor = useColorModeValue('green.700', 'green.300')

  const { feed, isLoading, refetch } = useForumFeed(
    forum.slug,
    groupSlug,
    { type: filter === 'all' ? undefined : filter }
  )

  const mutations = useThreadworksMutations(groupSlug)

  const handleCreateDiscussion = async (_forumSlug: string, data: { title: string; description?: string; content: string }) => {
    try {
      await mutations.createDiscussion(forum.slug, data)
      closeDiscussionModal()
      refetch()
    } catch {
      // surface error in modal — swallow here
    }
  }

  if (selectedDiscussion) {
    return (
      <DiscussionDetail
        discussion={selectedDiscussion}
        onBack={() => setSelectedDiscussion(null)}
        forumSlug={forum.slug}
        groupSlug={groupSlug}
      />
    )
  }

  return (
    <VStack align="stretch" gap={0}>
      {/* Header */}
      <HStack justify="space-between" align="center" mb={3}>
        <Heading as="h3" size="lg" fontWeight="bold">
          <HStack>
            <Text fontStyle="italic">{forum.title}</Text>
          </HStack>
        </Heading>
        <Button
          size="sm"
          variant="ghost"
          colorScheme="green"
          onClick={openDiscussionModal}
          p={2}
        >
          <IconPlus size={18} />
        </Button>
      </HStack>

      {/* Entry point */}
      {!showFeedPostComposer && (
        <Box mb={3}>
          <FeedEntryPoint
            onStartDiscussion={openDiscussionModal}
            onCreatePost={() => setShowFeedPostComposer(true)}
          />
        </Box>
      )}

      {/* FeedPost composer */}
      {showFeedPostComposer && (
        <Box mb={3}>
          <FeedPostComposer
            forumSlug={forum.slug}
            groupSlug={groupSlug}
            forum={forum}
            onCreated={() => { setShowFeedPostComposer(false); refetch() }}
            onCancel={() => setShowFeedPostComposer(false)}
          />
        </Box>
      )}

      {/* Filter tabs */}
      <HStack gap={1} mb={4} borderBottom="1px solid" borderColor={borderColor} pb={2}>
        {(['all', 'discussion', 'feed_post'] as FeedFilter[]).map((f) => (
          <Button
            key={f}
            size="xs"
            variant="ghost"
            bg={filter === f ? filterActiveBg : undefined}
            color={filter === f ? filterActiveColor : metaColor}
            fontWeight={filter === f ? 'semibold' : 'normal'}
            onClick={() => setFilter(f)}
            borderRadius="full"
            px={3}
          >
            {f === 'all' ? 'All' : f === 'discussion' ? 'Discussions' : 'Posts'}
          </Button>
        ))}
      </HStack>

      {/* Feed items */}
      {isLoading ? (
        <Flex justify="center" py={8}>
          <Spinner size="lg" color="green.500" />
        </Flex>
      ) : feed.length === 0 ? (
        <Box py={8} textAlign="center">
          <Text color={metaColor} fontSize="sm">
            {filter === 'discussion'
              ? 'No discussions yet.'
              : filter === 'feed_post'
              ? 'No posts yet.'
              : 'Nothing here yet. Start a discussion or post something.'}
          </Text>
        </Box>
      ) : (
        <VStack align="stretch" gap={3}>
          {feed.map((item: FeedItem, idx: number) => {
            const showMarker = idx > 0 && idx % RHYTHM_INTERVAL === 0

            return (
              <Box key={`${item.type}-${item.data.id}`}>
                {showMarker && (
                  <HStack my={2} gap={3}>
                    <Box flex={1} h="1px" bg={markerColor} />
                    <Text fontSize="xs" color={metaColor}>
                      {formatTimeAgo(item.created_at)}
                    </Text>
                    <Box flex={1} h="1px" bg={markerColor} />
                  </HStack>
                )}

                {item.type === 'discussion' ? (
                  <DiscussionFeedCard
                    discussion={item.data}
                    onSelect={() => setSelectedDiscussion(item.data)}
                    textColor={textColor}
                    metaColor={metaColor}
                    borderColor={borderColor}
                  />
                ) : (
                  <FeedPostItem feedPost={item.data} />
                )}
              </Box>
            )
          })}
        </VStack>
      )}

      <CreateDiscussionModal
        isOpen={discussionModalOpen}
        onClose={closeDiscussionModal}
        onSubmit={handleCreateDiscussion}
        isSubmitting={mutations.isCreatingDiscussion}
      />
    </VStack>
  )
}

// Discussion card in the unified feed (not the full detail view)
function DiscussionFeedCard({
  discussion,
  onSelect,
  textColor,
  metaColor,
  borderColor,
}: {
  discussion: Discussion
  onSelect: () => void
  textColor: string
  metaColor: string
  borderColor: string
}) {
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
      <HStack justify="space-between" align="flex-start">
        <VStack align="flex-start" gap={1} flex={1} minW={0}>
          <Text fontWeight="semibold" fontSize="sm" color={textColor} lineClamp={2}>
            {discussion.title}
          </Text>
          {discussion.description && (
            <Text fontSize="xs" color={metaColor} lineClamp={1}>
              {discussion.description}
            </Text>
          )}
          <HStack gap={3} mt={1}>
            <Text fontSize="xs" color={metaColor}>
              {discussion.created_by
                ? `${discussion.created_by.first_name} ${discussion.created_by.last_name}`.trim() ||
                  discussion.created_by.username
                : 'Unknown'}
            </Text>
            <Text fontSize="xs" color={metaColor}>{formatTimeAgo(discussion.created_at)}</Text>
            {discussion.post_count > 0 && (
              <Text fontSize="xs" color={metaColor}>
                {discussion.post_count} {discussion.post_count === 1 ? 'reply' : 'replies'}
              </Text>
            )}
          </HStack>
        </VStack>
      </HStack>
    </Box>
  )
}

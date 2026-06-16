// src/components/threadworks/DiscussionDetail.tsx

import { useState, useEffect, useRef } from 'react'
import { Box, Button, Heading, VStack, HStack, Spacer, Textarea, Text, Spinner, Flex } from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import { Divider } from '@components/common/Divider'
import { IconUser, IconClock, IconMessageCircle } from '@tabler/icons-react'
import { Discussion, CreatePostData } from '@mixtape/core/types/threadworksTypes'
import { useThreadworksMutations, useDiscussion } from '@hooks/threadworks/useThreadworks'
import { formatTimeAgo } from './threadworksUtils'
import PostItem from './PostItem'
import { useRealtimeEvents } from '@hooks/threadworks/useRealtimeEvents'

interface DiscussionDetailProps {
  discussion: Discussion
  onBack: () => void
  forumSlug: string
  groupSlug?: string
}

export default function DiscussionDetail({
  discussion,
  onBack,
  forumSlug,
  groupSlug,
}: DiscussionDetailProps) {
  const [postContent, setPostContent] = useState('')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null)
  const { joinRoom, leaveRoom, subscribe, emit } = useRealtimeEvents()

  const mutations = useThreadworksMutations(groupSlug)

  // Fetch full discussion with posts
  const { discussion: fullDiscussion, isLoading, refetch } = useDiscussion(
    forumSlug,
    discussion.slug,
    groupSlug
  )

  const currentDiscussion = fullDiscussion || discussion
  const posts = currentDiscussion.posts || []

  // Join discussion room on mount
  useEffect(() => {
    joinRoom('discussion', `${forumSlug}:${discussion.slug}`)

    // Subscribe to typing events
    const unsubscribeTyping = subscribe(
      'discussion',
      `${forumSlug}:${discussion.slug}`,
      'typing',
      (payload, user) => {
        if (payload.isTyping) {
          setTypingUsers((prev) => new Set([...prev, user]))
        } else {
          setTypingUsers((prev) => {
            const next = new Set(prev)
            next.delete(user)
            return next
          })
        }
      }
    )

    return () => {
      leaveRoom('discussion', `${forumSlug}:${discussion.slug}`)
      unsubscribeTyping()
    }
  }, [discussion.slug, forumSlug, joinRoom, leaveRoom, subscribe])

  const handleTyping = () => {
    emit('discussion', `${forumSlug}:${discussion.slug}`, 'typing', { isTyping: true })

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emit('discussion', `${forumSlug}:${discussion.slug}`, 'typing', { isTyping: false })
    }, 3000)
  }

  const handlePostSubmit = async () => {
    if (!postContent.trim()) return

    try {
      const data: CreatePostData = { content: postContent }
      await mutations.createPost(forumSlug, discussion.slug, data)
      setPostContent('')
      // Emit post created event
      emit('discussion', `${forumSlug}:${discussion.slug}`, 'post_created', {
        postCount: (fullDiscussion?.posts?.length || 0) + 1,
      })
      refetch()
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="lg" color="green.500" />
      </Flex>
    )
  }

  return (
    <Box>
      <Button variant="ghost" size="sm" mb={4} onClick={onBack}>
        ← Back to discussions
      </Button>

      <Heading size="md" mb={2}>
        {currentDiscussion.title}
      </Heading>

      <HStack gap={4} fontSize="sm" color={textColor} mb={6}>
        {currentDiscussion.created_by && (
          <HStack gap={1}>
            <IconUser size={16} />
            <Text>{currentDiscussion.created_by.first_name} {currentDiscussion.created_by.last_name}</Text>
          </HStack>
        )}
        <HStack gap={1}>
          <IconClock size={16} />
          <Text>{formatTimeAgo(currentDiscussion.created_at)}</Text>
        </HStack>
        <HStack gap={1}>
          <IconMessageCircle size={16} />
          <Text>{posts.length} posts</Text>
        </HStack>
      </HStack>

      <Box mb={6}><Divider/></Box>

      {typingUsers.size > 0 && (
        <Text fontSize="sm" color="gray.500" fontStyle="italic" mb={2}>
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </Text>
      )}

      <Box mb={6}><Divider/></Box>

      <VStack align="stretch" gap={4} mb={6} maxH="400px" overflowY="auto">
        {posts.map((post, idx) => (
          <PostItem key={post.id} post={post} isReply={!!post.parent_id} />
        ))}
      </VStack>

      <Box pt={4} borderTop="1px solid" borderTopColor={borderColor}>
        <VStack align="stretch" gap={3}>
          <Textarea
            placeholder="Add your thoughts to this discussion..."
            value={postContent}
            onChange={(e) => {
              setPostContent(e.target.value)
              handleTyping()
            }}
            resize="vertical"
            minH="80px"
            fontSize="sm"
          />
          <HStack>
            <Spacer />
            <Button
              size="sm"
              colorScheme="green"
              onClick={handlePostSubmit}
              disabled={!postContent.trim()}
              loading={mutations.isCreatingPost}
            >
              Reply
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  )
}
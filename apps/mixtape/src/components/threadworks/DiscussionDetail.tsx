// src/components/threadworks/DiscussionDetail.tsx

import { useState, useEffect, useRef } from 'react'
import { Box, Button, Heading, VStack, HStack, Spacer, Textarea, Text, Spinner, Flex } from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import { Divider } from '@components/common/Divider'
import { IconUser, IconClock, IconMessageCircle, IconQuote, IconCircleCheck } from '@tabler/icons-react'
import { Discussion, Post, CreatePostData, getThreadworksUserDisplayName } from '@mixtape/core/types/threadworksTypes'
import { useThreadworksMutations, useDiscussion } from '@hooks/threadworks/useThreadworks'
import { formatTimeAgo } from './threadworksUtils'
import PostItem from './PostItem'
import DiscussionSummaryBlock from './DiscussionSummaryBlock'
import ModeratorSummaryQueue from './ModeratorSummaryQueue'
import { useRealtimeEvents } from '@hooks/threadworks/useRealtimeEvents'

interface DiscussionDetailProps {
  discussion: Discussion
  onBack: () => void
  forumSlug: string
  groupSlug?: string
  isModerator?: boolean
}

interface ResolutionPanelProps {
  discussion: Discussion
  isModerator: boolean
  forumSlug: string
  groupSlug?: string
  onSettled: () => void
  mutations: ReturnType<typeof useThreadworksMutations>
}

function ResolutionBanner({ discussion, isModerator, forumSlug, groupSlug, onSettled, mutations }: ResolutionPanelProps) {
  const [busy, setBusy] = useState(false)
  const resPost = discussion.resolution_post
  if (!resPost) return null

  const handleUnresolve = async () => {
    setBusy(true)
    try {
      await mutations.unresolveDiscussion(forumSlug, discussion.slug)
      onSettled()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box
      className="dd-resolution-banner"
      bg="green.50"
      border="1px solid"
      borderColor="green.200"
      borderRadius="md"
      px={4}
      py={3}
      mb={3}
    >
      <HStack gap={2} align="center">
        <IconCircleCheck size={16} color="var(--chakra-colors-green-600)" />
        <Text fontSize="sm" fontWeight="semibold" color="green.700" flex={1}>
          Resolved — {resPost.author ? getThreadworksUserDisplayName(resPost.author) : 'Unknown'}'s post was marked as the answer
        </Text>
        {isModerator && (
          <Button size="xs" variant="ghost" colorPalette="gray" loading={busy} onClick={handleUnresolve}>
            Unresolve
          </Button>
        )}
      </HStack>
      <Text fontSize="xs" color="green.600" mt={1} lineClamp={2}>
        {resPost.content}
      </Text>
    </Box>
  )
}

interface MarkResolvedPanelProps {
  discussion: Discussion
  posts: Post[]
  forumSlug: string
  groupSlug?: string
  onSettled: () => void
  mutations: ReturnType<typeof useThreadworksMutations>
}

function MarkResolvedPanel({ discussion, posts, forumSlug, groupSlug, onSettled, mutations }: MarkResolvedPanelProps) {
  const [selectedPostId, setSelectedPostId] = useState('')
  const [busy, setBusy] = useState(false)

  const handleResolve = async () => {
    if (!selectedPostId) return
    setBusy(true)
    try {
      await mutations.resolveDiscussion(forumSlug, discussion.slug, selectedPostId)
      onSettled()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box
      className="dd-mark-resolved"
      border="1px dashed"
      borderColor="border.muted"
      borderRadius="md"
      px={4}
      py={3}
      mb={3}
    >
      <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={2}>
        Mark as Resolved
      </Text>
      <HStack gap={2}>
        <select
          style={{ flex: 1, fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--chakra-colors-border-muted)' }}
          value={selectedPostId}
          onChange={(e) => setSelectedPostId(e.target.value)}
        >
          <option value="">Select the resolving post…</option>
          {posts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.author ? getThreadworksUserDisplayName(p.author) : 'Unknown'}: {p.content.slice(0, 60)}
              {p.content.length > 60 ? '…' : ''}
            </option>
          ))}
        </select>
        <Button
          size="xs"
          colorPalette="green"
          disabled={!selectedPostId}
          loading={busy}
          onClick={handleResolve}
        >
          Mark Resolved
        </Button>
      </HStack>
    </Box>
  )
}

export default function DiscussionDetail({
  discussion,
  onBack,
  forumSlug,
  groupSlug,
  isModerator = false,
}: DiscussionDetailProps) {
  const [postContent, setPostContent] = useState('')
  const [quotedPost, setQuotedPost] = useState<Post | null>(null)
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const quoteBgColor = useColorModeValue('green.50', 'green.950')
  const quoteBorderColor = useColorModeValue('green.300', 'green.700')
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { joinRoom, leaveRoom, subscribe, emit } = useRealtimeEvents()

  const mutations = useThreadworksMutations(groupSlug)

  const { discussion: fullDiscussion, isLoading, refetch } = useDiscussion(
    forumSlug,
    discussion.slug,
    groupSlug
  )

  const currentDiscussion = fullDiscussion || discussion
  const posts = currentDiscussion.posts || []

  // Build a post-id lookup for quoted reply rendering
  const postById = Object.fromEntries(posts.map((p) => [p.id, p]))

  useEffect(() => {
    joinRoom('discussion', `${forumSlug}:${discussion.slug}`)

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

  const handleQuotePost = (post: Post) => {
    setQuotedPost(post)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handlePostSubmit = async () => {
    if (!postContent.trim()) return

    try {
      const data: CreatePostData = {
        content: postContent,
        ...(quotedPost && {
          quoted_post_id: quotedPost.id,
          quoted_passage: window.getSelection()?.toString() || '',
        }),
      }
      await mutations.createPost(forumSlug, discussion.slug, data)
      setPostContent('')
      setQuotedPost(null)
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
        ← Back
      </Button>

      <Heading size="md" mb={2}>
        {currentDiscussion.title}
      </Heading>

      <HStack gap={4} fontSize="sm" color={textColor} mb={4}>
        {currentDiscussion.created_by && (
          <HStack gap={1}>
            <IconUser size={16} />
            <Text>{getThreadworksUserDisplayName(currentDiscussion.created_by)}</Text>
          </HStack>
        )}
        <HStack gap={1}>
          <IconClock size={16} />
          <Text>{formatTimeAgo(currentDiscussion.created_at)}</Text>
        </HStack>
        <HStack gap={1}>
          <IconMessageCircle size={16} />
          <Text>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</Text>
        </HStack>
      </HStack>

      {/* Summary block (approved) */}
      <DiscussionSummaryBlock discussion={currentDiscussion} />

      {/* Moderator summary queue */}
      {isModerator && currentDiscussion.summary_pending && (
        <ModeratorSummaryQueue
          discussion={currentDiscussion}
          forumSlug={forumSlug}
          groupSlug={groupSlug}
          onSettled={refetch}
        />
      )}

      {/* Resolution state (D13 Phase 3) */}
      {currentDiscussion.resolution_post && (
        <ResolutionBanner
          discussion={currentDiscussion}
          isModerator={isModerator}
          forumSlug={forumSlug}
          groupSlug={groupSlug}
          onSettled={refetch}
          mutations={mutations}
        />
      )}
      {isModerator && !currentDiscussion.resolution_post && posts.length > 0 && (
        <MarkResolvedPanel
          discussion={currentDiscussion}
          posts={posts}
          forumSlug={forumSlug}
          groupSlug={groupSlug}
          onSettled={refetch}
          mutations={mutations}
        />
      )}

      <Box mb={4}><Divider /></Box>

      {typingUsers.size > 0 && (
        <Text fontSize="sm" color="gray.500" fontStyle="italic" mb={2}>
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing…
        </Text>
      )}

      <VStack align="stretch" gap={4} mb={6} maxH="400px" overflowY="auto">
        {posts.map((post) => (
          <Box key={post.id} position="relative" role="group">
            <PostItem
              post={post}
              quotedPost={post.quoted_post_id ? postById[post.quoted_post_id] : undefined}
              isReply={!!post.parent_id}
            />
            <Button
              size="xs"
              variant="ghost"
              position="absolute"
              top={0}
              right={0}
              opacity={0}
              _groupHover={{ opacity: 1 }}
              transition="opacity 0.15s"
              onClick={() => handleQuotePost(post)}
              title="Quote this post"
            >
              <IconQuote size={14} />
            </Button>
          </Box>
        ))}
      </VStack>

      <Box pt={4} borderTop="1px solid" borderTopColor={borderColor}>
        <VStack align="stretch" gap={3}>
          {/* Quoted post indicator */}
          {quotedPost && (
            <Box
              bg={quoteBgColor}
              border="1px solid"
              borderColor={quoteBorderColor}
              borderRadius="sm"
              px={3}
              py={2}
            >
              <HStack justify="space-between">
                <Text fontSize="xs" color="green.600">
                  Quoting {getThreadworksUserDisplayName(quotedPost.author)}
                </Text>
                <Button size="xs" variant="ghost" onClick={() => setQuotedPost(null)} color="gray.400">
                  ✕
                </Button>
              </HStack>
              <Text fontSize="xs" color="gray.500" lineClamp={1} mt={0.5}>
                {quotedPost.content}
              </Text>
            </Box>
          )}

          <Textarea
            ref={textareaRef}
            placeholder={quotedPost ? 'Add your reply…' : 'Add your thoughts to this discussion…'}
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
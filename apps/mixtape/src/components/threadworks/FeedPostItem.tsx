// src/components/threadworks/FeedPostItem.tsx

import { useState } from 'react'
import { Box, HStack, VStack, Avatar, Text, Image, Button } from '@chakra-ui/react'
import { IconMicrophone, IconLink, IconMessageCircle, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useColorModeValue } from '@components/ui/color-mode'
import { FeedPost, Post } from '@mixtape/core/types/threadworksTypes'
import { formatTimeAgo } from './threadworksUtils'
import PostItem from './PostItem'

interface FeedPostItemProps {
  feedPost: FeedPost
  onReply?: (feedPost: FeedPost) => void
}

export default function FeedPostItem({ feedPost, onReply }: FeedPostItemProps) {
  const [showReplies, setShowReplies] = useState(false)

  const textColor = useColorModeValue('gray.700', 'gray.300')
  const metaColor = useColorModeValue('gray.500', 'gray.500')
  const borderColor = useColorModeValue('gray.100', 'gray.700')
  const bgColor = useColorModeValue('white', 'gray.800')
  const linkBgColor = useColorModeValue('gray.50', 'gray.750')

  const author = feedPost.author
  const authorName = author
    ? `${author.first_name} ${author.last_name}`.trim() || author.username
    : 'Deleted member'

  return (
    <Box border="1px solid" borderColor={borderColor} borderRadius="md" bg={bgColor} overflow="hidden">
      {/* Image-first layout for image kind */}
      {feedPost.kind === 'image' && feedPost.image_file && (
        <Image
          src={feedPost.image_file}
          alt={feedPost.title || 'Image post'}
          w="full"
          maxH="400px"
          objectFit="cover"
        />
      )}

      <Box p={4}>
        {/* Author row */}
        <HStack gap={3} align="start" mb={3}>
          <Avatar.Root size="sm" flexShrink={0}>
            {author?.avatar_url && <Avatar.Image src={author.avatar_url} />}
            <Avatar.Fallback name={authorName} />
          </Avatar.Root>
          <Box flex={1}>
            <HStack gap={2} align="center">
              <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                {authorName}
              </Text>
              <Text fontSize="xs" color={metaColor}>
                {formatTimeAgo(feedPost.created_at)}
              </Text>
            </HStack>
          </Box>
        </HStack>

        {/* Title */}
        {feedPost.title && (
          <Text fontWeight="semibold" fontSize="md" color={textColor} mb={2}>
            {feedPost.title}
          </Text>
        )}

        {/* Kind-specific body */}
        {feedPost.kind === 'text' && feedPost.body_text && (
          <Text fontSize="sm" color={textColor} lineHeight="1.6" whiteSpace="pre-wrap">
            {feedPost.body_text}
          </Text>
        )}

        {feedPost.kind === 'voice' && (
          <HStack gap={2} py={2}>
            <IconMicrophone size={16} />
            {feedPost.audio_file ? (
              <audio controls src={feedPost.audio_file} style={{ flex: 1, height: '36px' }} />
            ) : (
              <Text fontSize="sm" color={metaColor}>Voice note</Text>
            )}
          </HStack>
        )}

        {feedPost.kind === 'link' && feedPost.link_url && (
          <a
            href={feedPost.link_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'block' }}
          >
          <Box
            bg={linkBgColor}
            borderRadius="md"
            p={3}
            border="1px solid"
            borderColor={borderColor}
          >
            <HStack gap={2} mb={feedPost.link_preview?.title ? 1 : 0}>
              <IconLink size={14} />
              <Text fontSize="xs" color={metaColor} lineClamp={1}>
                {feedPost.link_url}
              </Text>
            </HStack>
            {feedPost.link_preview?.title && (
              <Text fontSize="sm" fontWeight="medium" color={textColor} lineClamp={2}>
                {feedPost.link_preview.title}
              </Text>
            )}
            {feedPost.link_preview?.description && (
              <Text fontSize="xs" color={metaColor} lineClamp={2} mt={1}>
                {feedPost.link_preview.description}
              </Text>
            )}
          </Box>
          </a>
        )}

        {/* Footer — reply count + actions */}
        <HStack mt={3} gap={4}>
          {feedPost.post_count > 0 && (
            <Button
              variant="ghost"
              size="xs"
              color={metaColor}
              onClick={() => setShowReplies((v) => !v)}
            >
              <IconMessageCircle size={14} />
              {feedPost.post_count} {feedPost.post_count === 1 ? 'reply' : 'replies'}
              {showReplies ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
            </Button>
          )}
          {onReply && (
            <Button
              variant="ghost"
              size="xs"
              color={metaColor}
              onClick={() => onReply(feedPost)}
            >
              Reply
            </Button>
          )}
        </HStack>

        {/* Replies */}
        {showReplies && feedPost.posts && feedPost.posts.length > 0 && (
          <VStack align="stretch" gap={3} mt={3} pt={3} borderTop="1px solid" borderTopColor={borderColor}>
            {feedPost.posts.map((post: Post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  )
}

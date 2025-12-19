// src/components/threadworks/PostItem.tsx

import { Box, HStack, Avatar, Text } from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import { Post } from '@/types/threadworksTypes'
import { formatTimeAgo } from './threadworksUtils'

interface PostItemProps {
  post: Post
  isReply?: boolean
  searchTerm?: string
}

export default function PostItem({ post, isReply = false, searchTerm = '' }: PostItemProps) {
  const textColor = useColorModeValue('gray.700', 'gray.300')

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term || term.length < 2) return text
    const regex = new RegExp(`(${term})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, idx) => {
      if (regex.test(part)) {
        return (
          <Text
            key={idx}
            as="span"
            bg="yellow.200"
            px={1}
            borderRadius="sm"
            style={{
              animation: 'fadeHighlight 4.5s ease-out forwards',
            }}
          >
            {part}
          </Text>
        )
      }
      return part
    })
  }

  return (
    <Box
      pl={isReply ? 6 : 0}
      mt={isReply ? 3 : 0}
      borderLeft={isReply ? '2px solid' : undefined}
      borderLeftColor={isReply ? 'gray.200' : undefined}
    >
      <HStack gap={3} align="start">
        <Avatar.Root size="sm" flexShrink={0}>
          {post.author.avatar_url && <Avatar.Image src={post.author.avatar_url} />}
          <Avatar.Fallback name={post.author.username} />
        </Avatar.Root>
        <Box flex={1}>
          <HStack gap={2} align="center" mb={1}>
            <Text fontWeight="semibold" fontSize="sm" color={textColor}>
              {post.author.first_name} {post.author.last_name}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {formatTimeAgo(post.created_at)}
            </Text>
          </HStack>
          <Text fontSize="sm" lineHeight="1.5" color={textColor}>
            {searchTerm ? highlightSearchTerm(post.content, searchTerm) : post.content}
          </Text>
        </Box>
      </HStack>
    </Box>
  )
}
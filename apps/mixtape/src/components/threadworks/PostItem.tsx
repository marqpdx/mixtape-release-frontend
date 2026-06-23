// src/components/threadworks/PostItem.tsx

import { useRef, useState } from 'react'
import { Box, Button, HStack, Avatar, Text, Badge } from '@chakra-ui/react'
import { IconQuote } from '@tabler/icons-react'
import { useColorModeValue } from '@components/ui/color-mode'
import { Post } from '@mixtape/core/types/threadworksTypes'
import { formatTimeAgo } from './threadworksUtils'
import QuotedPostCallout from './QuotedPostCallout'

interface PostItemProps {
  post: Post
  quotedPost?: Post
  isReply?: boolean
  searchTerm?: string
  onQuote?: (post: Post, passage?: string) => void
}

export default function PostItem({ post, quotedPost, isReply = false, searchTerm = '', onQuote }: PostItemProps) {
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const quoteChipBg = useColorModeValue('green.50', 'green.900')
  const quoteChipColor = useColorModeValue('green.700', 'green.300')
  const contentRef = useRef<HTMLDivElement>(null)
  const [pendingSelection, setPendingSelection] = useState('')

  const handleMouseUp = () => {
    if (!onQuote) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setPendingSelection('')
      return
    }
    const range = sel.getRangeAt(0)
    if (contentRef.current?.contains(range.commonAncestorContainer)) {
      setPendingSelection(sel.toString().trim())
    } else {
      setPendingSelection('')
    }
  }

  const handleQuoteSelection = () => {
    if (!onQuote) return
    onQuote(post, pendingSelection || undefined)
    setPendingSelection('')
    window.getSelection()?.removeAllRanges()
  }

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
            style={{ animation: 'fadeHighlight 4.5s ease-out forwards' }}
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
      role="group"
      pl={isReply ? 6 : 0}
      mt={isReply ? 3 : 0}
      borderLeft={isReply ? '2px solid' : undefined}
      borderLeftColor={isReply ? 'gray.200' : undefined}
      onMouseLeave={() => setPendingSelection('')}
    >
      <HStack gap={3} align="start">
        <Avatar.Root size="sm" flexShrink={0}>
          {post.author?.avatar_url && <Avatar.Image src={post.author.avatar_url} />}
          <Avatar.Fallback name={post.author?.username} />
        </Avatar.Root>
        <Box flex={1}>
          <HStack gap={2} align="center" mb={1}>
            <Text fontWeight="semibold" fontSize="sm" color={textColor}>
              {post.author ? `${post.author.first_name} ${post.author.last_name}`.trim() : 'Deleted member'}
            </Text>
            {post.is_author_distinguished && (
              <Badge size="sm" colorScheme="green" variant="subtle" fontSize="2xs">
                Author
              </Badge>
            )}
            <Text fontSize="xs" color="gray.500">
              {formatTimeAgo(post.created_at)}
            </Text>
          </HStack>

          {/* Quoted reply callout */}
          {quotedPost && (
            <QuotedPostCallout
              quotedPost={quotedPost}
              quotedPassage={post.quoted_passage}
            />
          )}

          <Box ref={contentRef} onMouseUp={handleMouseUp}>
            <Text fontSize="sm" lineHeight="1.5" color={textColor}>
              {searchTerm ? highlightSearchTerm(post.content, searchTerm) : post.content}
            </Text>
          </Box>

          {/* Selection quote chip — appears when text is selected within this post */}
          {pendingSelection && onQuote && (
            <Button
              size="xs"
              mt={1}
              bg={quoteChipBg}
              color={quoteChipColor}
              variant="ghost"
              onClick={handleQuoteSelection}
            >
              <IconQuote size={12} />
              Quote selection
            </Button>
          )}

          {/* Whole-post quote button — fades in on hover when no selection is pending */}
          {!pendingSelection && onQuote && (
            <Button
              size="xs"
              mt={1}
              variant="ghost"
              color="gray.400"
              opacity={0}
              _groupHover={{ opacity: 1 }}
              transition="opacity 0.15s"
              onClick={() => onQuote(post)}
              title="Quote this post"
            >
              <IconQuote size={12} />
            </Button>
          )}
        </Box>
      </HStack>
    </Box>
  )
}
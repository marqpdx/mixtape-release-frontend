// src/components/threadworks/QuotedPostCallout.tsx

import { Box, Text, HStack } from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import { Post } from '@mixtape/core/types/threadworksTypes'
import { getThreadworksUserDisplayName } from '@mixtape/core/types/threadworksTypes'

interface QuotedPostCalloutProps {
  quotedPost: Post
  quotedPassage?: string
}

export default function QuotedPostCallout({ quotedPost, quotedPassage }: QuotedPostCalloutProps) {
  const borderColor = useColorModeValue('green.400', 'green.600')
  const bgColor = useColorModeValue('green.50', 'green.950')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const authorColor = useColorModeValue('gray.700', 'gray.300')

  const displayText = quotedPassage || quotedPost.content
  const truncated = displayText.length > 200 ? `${displayText.slice(0, 200)}…` : displayText

  return (
    <Box
      borderLeft="3px solid"
      borderLeftColor={borderColor}
      bg={bgColor}
      px={3}
      py={2}
      borderRadius="sm"
      mb={2}
    >
      <HStack gap={1} mb={1}>
        <Text fontSize="xs" fontWeight="semibold" color={authorColor}>
          {getThreadworksUserDisplayName(quotedPost.author)}
        </Text>
        {quotedPassage && (
          <Text fontSize="xs" color={textColor}>
            · selected passage
          </Text>
        )}
      </HStack>
      <Text fontSize="xs" color={textColor} lineHeight="1.5" fontStyle="italic">
        {truncated}
      </Text>
    </Box>
  )
}

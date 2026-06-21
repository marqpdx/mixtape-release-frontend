// src/components/threadworks/DiscussionSummaryBlock.tsx

import { Box, Text, HStack } from '@chakra-ui/react'
import { IconSparkles } from '@tabler/icons-react'
import { useColorModeValue } from '@components/ui/color-mode'
import { Discussion } from '@mixtape/core/types/threadworksTypes'

interface DiscussionSummaryBlockProps {
  discussion: Discussion
}

export default function DiscussionSummaryBlock({ discussion }: DiscussionSummaryBlockProps) {
  const bgColor = useColorModeValue('blue.50', 'blue.950')
  const borderColor = useColorModeValue('blue.200', 'blue.700')
  const textColor = useColorModeValue('blue.800', 'blue.200')
  const labelColor = useColorModeValue('blue.500', 'blue.400')

  if (!discussion.summary) return null

  return (
    <Box
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      px={4}
      py={3}
      mb={4}
    >
      <HStack gap={2} mb={1}>
        <IconSparkles size={14} color="currentColor" style={{ color: 'inherit', opacity: 0.7 }} />
        <Text fontSize="xs" fontWeight="semibold" color={labelColor} textTransform="uppercase" letterSpacing="wide">
          Summary
        </Text>
      </HStack>
      <Text fontSize="sm" color={textColor} lineHeight="1.6">
        {discussion.summary}
      </Text>
    </Box>
  )
}

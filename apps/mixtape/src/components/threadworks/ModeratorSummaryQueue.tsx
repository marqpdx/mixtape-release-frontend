// src/components/threadworks/ModeratorSummaryQueue.tsx

import { useState } from 'react'
import { Box, Button, Text, HStack, VStack, Badge } from '@chakra-ui/react'
import { IconSparkles, IconCheck, IconX } from '@tabler/icons-react'
import { useColorModeValue } from '@components/ui/color-mode'
import { Discussion } from '@mixtape/core/types/threadworksTypes'
import { useDiscussionSummaryMutations } from '@hooks/threadworks/useThreadworks'

interface ModeratorSummaryQueueProps {
  discussion: Discussion
  forumSlug: string
  groupSlug?: string
  onSettled?: () => void
}

export default function ModeratorSummaryQueue({
  discussion,
  forumSlug,
  groupSlug,
  onSettled,
}: ModeratorSummaryQueueProps) {
  const [showCompare, setShowCompare] = useState(false)
  const bgColor = useColorModeValue('amber.50', 'amber.950')
  const borderColor = useColorModeValue('amber.200', 'amber.700')
  const labelColor = useColorModeValue('amber.700', 'amber.300')
  const textColor = useColorModeValue('gray.700', 'gray.300')

  const { approveSummary, dismissSummary, isApproving, isDismissing } =
    useDiscussionSummaryMutations(forumSlug, discussion.slug, groupSlug)

  if (!discussion.summary_pending) return null

  const deltaPercent = discussion.summary_pending_delta != null
    ? `${Math.round(discussion.summary_pending_delta * 100)}% changed`
    : null

  const handleApprove = async () => {
    await approveSummary()
    onSettled?.()
  }

  const handleDismiss = async () => {
    await dismissSummary()
    onSettled?.()
  }

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
      <HStack justify="space-between" align="flex-start" mb={2}>
        <HStack gap={2}>
          <IconSparkles size={14} />
          <Text fontSize="xs" fontWeight="semibold" color={labelColor} textTransform="uppercase" letterSpacing="wide">
            Clio candidate
          </Text>
          {deltaPercent && (
            <Badge size="sm" colorScheme={discussion.summary_pending_substantive ? 'orange' : 'gray'}>
              {deltaPercent}
              {discussion.summary_pending_substantive && ' · substantive'}
            </Badge>
          )}
        </HStack>
        <HStack gap={2}>
          {discussion.summary && (
            <Button size="xs" variant="ghost" onClick={() => setShowCompare((v) => !v)}>
              {showCompare ? 'Hide compare' : 'Compare'}
            </Button>
          )}
          <Button
            size="xs"
            colorScheme="green"
            onClick={handleApprove}
            loading={isApproving}
          >
            <IconCheck size={12} />
            Approve
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={handleDismiss}
            loading={isDismissing}
          >
            <IconX size={12} />
            Dismiss
          </Button>
        </HStack>
      </HStack>

      {showCompare && discussion.summary ? (
        <HStack align="flex-start" gap={4}>
          <VStack align="stretch" flex={1} gap={1}>
            <Text fontSize="xs" fontWeight="semibold" color={labelColor}>Current</Text>
            <Text fontSize="sm" color={textColor} lineHeight="1.6">{discussion.summary}</Text>
          </VStack>
          <VStack align="stretch" flex={1} gap={1}>
            <Text fontSize="xs" fontWeight="semibold" color={labelColor}>Candidate</Text>
            <Text fontSize="sm" color={textColor} lineHeight="1.6">{discussion.summary_pending}</Text>
          </VStack>
        </HStack>
      ) : (
        <Text fontSize="sm" color={textColor} lineHeight="1.6">
          {discussion.summary_pending}
        </Text>
      )}
    </Box>
  )
}

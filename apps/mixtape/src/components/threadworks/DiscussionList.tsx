// src/components/threadworks/DiscussionList.tsx

import { useMemo } from 'react'
import { Box, Badge, Heading, VStack, HStack, Text, Flex } from '@chakra-ui/react'
import { useColorModeValue } from '@components/ui/color-mode'
import { IconUser, IconMessageCircle } from '@tabler/icons-react'
import { Discussion, formatThreadPostCount } from '@mixtape/core/types/threadworksTypes'
import { formatTimeAgo, truncateText } from './threadworksUtils'

interface DiscussionListProps {
  discussions: Discussion[]
  searchFilter: string
  onDiscussionSelect: (discussionId: string) => void
}

export default function DiscussionList({
  discussions,
  searchFilter,
  onDiscussionSelect,
}: DiscussionListProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const iconColor = useColorModeValue('green.600', 'green.400')

  const filteredDiscussions = useMemo(() => {
    if (!searchFilter.trim()) return discussions
    const query = searchFilter.toLowerCase()
    return discussions.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        (d.last_post?.content.toLowerCase().includes(query))
    )
  }, [discussions, searchFilter])

  if (filteredDiscussions.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color={textColor}>No discussions found</Text>
      </Box>
    )
  }

  return (
    <VStack align="stretch" gap={2}>
      {filteredDiscussions.map((discussion) => {
        const latestPost = discussion.last_post

        return (
          <Box
            key={discussion.id}
            p={4}
            borderWidth={1}
            borderColor={borderColor}
            borderRadius="lg"
            _hover={{ bg: hoverBg }}
            cursor="pointer"
            transition="all 0.2s"
            onClick={() => onDiscussionSelect(discussion.id)}
          >
            <Flex justify="space-between" align="start" mb={2}>
              <HStack gap={3} flex={1} minW={0}>
                <Box color={iconColor}>
                  <IconMessageCircle size={20} />
                </Box>
                <VStack align="start" gap={1} flex={1} minW={0}>
                  <Heading size="sm" lineClamp={2}>
                    {discussion.title}
                  </Heading>
                  <HStack gap={2} fontSize="xs" color={textColor}>
                    {discussion.created_by && (
                      <HStack gap={1}>
                        <IconUser size={14} />
                        <Text>{discussion.created_by.first_name} {discussion.created_by.last_name}</Text>
                      </HStack>
                    )}
                    <Text>•</Text>
                    <Text>{formatTimeAgo(discussion.created_at)}</Text>
                  </HStack>
                </VStack>
              </HStack>
              <Badge colorScheme="blue" size="sm" flexShrink={0}>
                {formatThreadPostCount(discussion.post_count)}
              </Badge>
            </Flex>
            {latestPost && (
              <Text fontSize="xs" color={textColor} fontStyle="italic" lineClamp={2}>
                {truncateText(latestPost.content, 100)}
              </Text>
            )}
          </Box>
        )
      })}
    </VStack>
  )
}

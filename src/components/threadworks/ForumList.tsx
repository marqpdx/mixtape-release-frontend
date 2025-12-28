// src/components/threadworks/ForumList.tsx

import { Accordion, Badge, HStack, Heading, VStack, Box, Text } from '@chakra-ui/react'
import { Forum, getForumVisibilityLabel } from '@mixtape/core/types/threadworksTypes'
import { IconMessages } from '@tabler/icons-react'
import ForumDetail from './ForumDetail'
import { useColorModeValue } from '@components/ui/color-mode'

interface ForumListProps {
  forums: Forum[]
  expandedForums: string[]
  onForumToggle: (forumIds: string[]) => void
  groupSlug?: string
  setActiveSection: (section: string, params?: Record<string, string>) => void
  onDiscussionCreated?: () => void
}

export default function ForumList({
  forums,
  expandedForums,
  onForumToggle,
  groupSlug,
  setActiveSection,
  onDiscussionCreated,
}: ForumListProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const hoverBg = useColorModeValue('green.50', 'green.950')
  const iconColor = useColorModeValue('green.600', 'green.400')
  const triggerBg = useColorModeValue('white', 'gray.800')

  return (
    <VStack align="stretch" gap={4}>
      {/* Forums Label */}
      {/* <Heading as="h2" size="lg" fontWeight="bold">
        Forums
      </Heading> */}

      <Accordion.Root
        value={expandedForums}
        onValueChange={(details) => onForumToggle(details.value)}
        multiple
        collapsible
      >
        {forums.map((forum) => (
          <Accordion.Item key={forum.id} value={forum.id}>
            <Accordion.ItemTrigger
              bg={triggerBg}
              _hover={{ bg: hoverBg, cursor: 'pointer' }}
              borderRadius="lg"
              px={4}
              py={3}
              border="1px solid"
              borderColor={borderColor}
              transition="all 0.2s"
              mb={2}
            >
              <HStack gap={3} flex={1} justify="space-between">
                <HStack gap={3} flex={1} minW={0}>
                  <Box color={iconColor}>
                    <IconMessages size={22} />
                  </Box>
                  <VStack align="start" gap={1} flex={1} minW={0}>
                    {/* Forum Title */}
                    <Heading as="h3" size="xl" fontWeight="bold">
                      {forum.title}
                    </Heading>

                    {/* Forum Description */}
                    {forum.description && (
                      <Text fontSize="xs" color={textColor} lineClamp={1}>
                        {forum.description}
                      </Text>
                    )}

                    {/* Badges */}
                    <HStack gap={2} fontSize="xs">
                      <Badge colorScheme="green" size="sm" variant="subtle">
                        {getForumVisibilityLabel(forum.visibility)}
                      </Badge>
                      <Badge colorScheme="blue" variant="subtle" size="sm">
                        {forum.discussion_count} {forum.discussion_count === 1 ? 'discussion' : 'discussions'}
                      </Badge>
                    </HStack>
                  </VStack>
                </HStack>
                <Accordion.ItemIndicator flexShrink={0} />
              </HStack>
            </Accordion.ItemTrigger>

            {expandedForums.includes(forum.id) && (
              <Accordion.ItemContent>
                <Box
                  borderLeft="2px solid"
                  borderLeftColor="green.500"
                  pl={4}
                  py={1}
                  ml={2}
                >
                  <ForumDetail
                    forum={forum}
                    groupSlug={groupSlug}
                    setActiveSection={setActiveSection}
                    onDiscussionCreated={onDiscussionCreated}
                  />
                </Box>
              </Accordion.ItemContent>
            )}
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </VStack>
  )
}

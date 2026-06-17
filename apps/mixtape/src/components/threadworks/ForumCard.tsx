"use client"

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Flex,
} from "@chakra-ui/react"
import { Card, Avatar } from "@chakra-ui/react"
import { IconMessages, IconClock, IconUsers } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useColorModeValue } from "@components/ui/color-mode"
import { Forum } from "./interfaces"

interface ForumCardProps {
  forum: Forum
  onClick?: (slug: string) => void
}

export default function ForumCard({ forum, onClick }: ForumCardProps) {
  const router = useRouter()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString()

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'green'
      case 'members': return 'blue'
      case 'group': return 'purple'
      default: return 'gray'
    }
  }

  return (
    <Card.Root
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      _hover={{
        bg: hoverBg,
        transform: 'translateY(-2px)',
        shadow: 'lg',
      }}
      transition="all 0.2s"
      cursor="pointer"
      onClick={() => onClick ? onClick(forum.slug) : router.push(`/threadworks/${forum.slug}`)}
    >
      <Card.Header>
        <Flex justify="space-between" align="start">
          <VStack align="start" gap={1} flex={1}>
            <Heading size="md" lineClamp={2}>
              {forum.title}
            </Heading>
            <HStack gap={2} wrap="wrap">
              <Badge colorScheme={getVisibilityColor(forum.visibility)} size="sm">
                {forum.visibility}
              </Badge>
              {forum.audience_type === 'subset' ? (
                <Badge colorScheme="orange" size="sm">
                  {forum.audience_member_count != null
                    ? `${forum.audience_member_count} members`
                    : 'Subset'}
                </Badge>
              ) : (
                <Badge colorScheme="gray" variant="subtle" size="sm">
                  All Members
                </Badge>
              )}
            </HStack>
          </VStack>
        </Flex>
      </Card.Header>

      <Card.Body pt={0}>
        <Text color={textColor} fontSize="sm" lineClamp={3} mb={4}>
          {forum.description || 'No description available'}
        </Text>

        {/* Stats */}
        <VStack gap={3} align="stretch">
          <HStack justify="space-between">
            <HStack gap={1}>
              <IconMessages size={16} color={textColor} />
              <Text fontSize="sm" color={textColor}>
                {forum.topic_count} topics
              </Text>
            </HStack>
            <HStack gap={1}>
              <IconClock size={16} color={textColor} />
              <Text fontSize="sm" color={textColor}>
                {formatDate(forum.updated_at)}
              </Text>
            </HStack>
          </HStack>

          {/* Recent Participants */}
          {Array.isArray(forum.recent_participants) && forum.recent_participants.length > 0 && (
            <Box>
              <HStack gap={2} mb={2}>
                <IconUsers size={16} color={textColor} />
                <Text fontSize="sm" color={textColor}>Recent activity</Text>
              </HStack>
              <HStack gap={-2}>
                {forum.recent_participants.slice(0, 5).map((participant) => (
                  <Avatar.Root key={participant.id} size="sm">
                    <Avatar.Image src={participant.avatar_url} />
                    <Avatar.Fallback>
                      {(participant.first_name?.[0] || participant.username?.[0] || "?").toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                ))}
                {forum.recent_participants.length > 5 && (
                  <Box
                    w={8}
                    h={8}
                    borderRadius="full"
                    bg={borderColor}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    border="2px solid"
                    borderColor={bgColor}
                    fontSize="xs"
                    color={textColor}
                  >
                    +{forum.recent_participants.length - 5}
                  </Box>
                )}
              </HStack>
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}

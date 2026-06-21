// src/components/threadworks/FeedEntryPoint.tsx
// Content type selector at the top of the Forum feed.
// "Start a discussion" → discussion composer
// "Post something"     → FeedPost composer

import { Button, HStack, Text } from '@chakra-ui/react'
import { IconMessageCircle2, IconLayoutGrid } from '@tabler/icons-react'
import { useColorModeValue } from '@components/ui/color-mode'

interface FeedEntryPointProps {
  onStartDiscussion: () => void
  onCreatePost: () => void
}

export default function FeedEntryPoint({ onStartDiscussion, onCreatePost }: FeedEntryPointProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const placeholderColor = useColorModeValue('gray.400', 'gray.500')

  return (
    <HStack
      gap={3}
      p={3}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      cursor="text"
      _hover={{ borderColor: 'green.300' }}
      transition="border-color 0.15s"
      justify="space-between"
    >
      <Text fontSize="sm" color={placeholderColor} flex={1}>
        Share something with the group…
      </Text>
      <HStack gap={2}>
        <Button
          size="xs"
          variant="ghost"
          colorScheme="green"
          onClick={onStartDiscussion}
        >
          <IconMessageCircle2 size={14} />
          Discussion
        </Button>
        <Button
          size="xs"
          variant="ghost"
          colorScheme="green"
          onClick={onCreatePost}
        >
          <IconLayoutGrid size={14} />
          Post
        </Button>
      </HStack>
    </HStack>
  )
}

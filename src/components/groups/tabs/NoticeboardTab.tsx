// src/components/groups/tabs/NoticeboardTab.tsx

'use client'

import { VStack, Heading, Text, Box } from '@chakra-ui/react'
import { Noticeboard } from '@components/noticeboard/Noticeboard'

interface NoticeboardTabProps {
  group: any
}

export function NoticeboardTab({ group }: NoticeboardTabProps) {
  return (
    <VStack align="stretch" gap={6}>
      <Box>
        <Heading size="lg" mb={2}>
          Noticeboard
        </Heading>
        <Text color="gray.600">
          Recent activity and published content from group members
        </Text>
      </Box>

      <Noticeboard groupSlug={group.slug} />
    </VStack>
  )
}
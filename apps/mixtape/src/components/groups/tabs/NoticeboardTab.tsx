// src/components/groups/tabs/NoticeboardTab.tsx

'use client'

import { VStack, Heading, Text, Box } from '@chakra-ui/react'
import type { Group } from "@mixtape/core/types/groupTypes";
// import { Noticeboard } from '@components/noticeboard/Noticeboard'

interface NoticeboardTabProps {
  group: Group
}

export function NoticeboardTab({ group }: NoticeboardTabProps) {
  void group;
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

      {/* <Noticeboard groupSlug={group.slug} /> */}
    </VStack>
  )
}

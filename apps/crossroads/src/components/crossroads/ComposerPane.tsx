// components/crossroads/ComposerPane.tsx

'use client';

import { Tabs, Text, VStack } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import Composer from './Composer';
import FollowingList from './FollowingList';

export default function ComposerPane() {
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Tabs.Root defaultValue="composer">
      <VStack align="stretch" gap={1} mb={4}>
        <Text fontSize="sm" color={mutedColor}>
          Capture first, then decide whether you want to post, follow the flow of others, or update your public profile.
        </Text>
      </VStack>
      <Tabs.List mb={4}>
        <Tabs.Trigger value="composer" fontSize="md">Add to Storyline</Tabs.Trigger>
        <Tabs.Trigger value="following" fontSize="md">Following</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="composer">
        <Composer />
      </Tabs.Content>

      <Tabs.Content value="following">
        <FollowingList />
      </Tabs.Content>
    </Tabs.Root>
  );
}

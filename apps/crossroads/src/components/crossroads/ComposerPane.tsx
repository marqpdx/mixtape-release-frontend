// components/crossroads/ComposerPane.tsx

'use client';

import { Tabs } from '@chakra-ui/react';
import Composer from './Composer';
import FollowingList from './FollowingList';

export default function ComposerPane() {
  return (
    <Tabs.Root defaultValue="composer">
      <Tabs.List mb={4}>
        <Tabs.Trigger value="composer">Composer</Tabs.Trigger>
        <Tabs.Trigger value="following">Following</Tabs.Trigger>
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

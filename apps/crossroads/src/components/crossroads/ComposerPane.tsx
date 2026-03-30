// components/crossroads/ComposerPane.tsx

'use client';

import { Tabs } from '@chakra-ui/react';
import Composer from './Composer';
import FollowingList from './FollowingList';
import MyProfilePanel from './MyProfilePanel';

export default function ComposerPane() {
  return (
    <Tabs.Root defaultValue="composer">
      <Tabs.List mb={4}>
        <Tabs.Trigger value="composer" fontSize="md">Add to Storyline</Tabs.Trigger>
        <Tabs.Trigger value="following" fontSize="md">Following</Tabs.Trigger>
        <Tabs.Trigger value="profile" fontSize="md">My Profile</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="composer">
        <Composer />
      </Tabs.Content>

      <Tabs.Content value="following">
        <FollowingList />
      </Tabs.Content>

      <Tabs.Content value="profile">
        <MyProfilePanel />
      </Tabs.Content>
    </Tabs.Root>
  );
}

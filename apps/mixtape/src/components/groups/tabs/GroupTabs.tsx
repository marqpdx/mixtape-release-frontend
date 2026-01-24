// apps/mixtape/src/components/groups/tabs/GroupTabs.tsx

"use client";

import { useEffect, useState } from "react";
import { HStack, Text } from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import {
  IconInfoHexagon,
  IconMessages,
  IconUsers,
  IconFolder,
} from "@tabler/icons-react";
import { OverviewTab } from "./OverviewTab";
import { ThreadworksTab } from "./ThreadworksTab";
import { MembersTab } from "./MembersTab";
import { CollectionsTab } from "./CollectionsTab";
import { LandingTab } from "./LandingTab";
import { JoiningTab } from "./JoiningTab";
import type { Group } from "@mixtape/core/types/groupTypes";

interface GroupTabsProps {
  group: Group;
  viewingAsMember: boolean;
  isMember: boolean;
  onJoinGroup?: () => void;
}

const memberTabs = [
  { key: 'overview', label: 'Overview', icon: IconInfoHexagon },
  { key: 'members', label: 'Group Members', icon: IconUsers },
  { key: 'threadworks', label: 'Threadworks', icon: IconMessages },
  { key: 'collections', label: 'Collections', icon: IconFolder },
];

const publicTabs = [
  { key: 'landing', label: 'Landing Page', icon: IconInfoHexagon },
  { key: 'joining', label: 'How to Join', icon: IconUsers },
];

export function GroupTabs({
  group,
  viewingAsMember,
  isMember,
  onJoinGroup,
}: GroupTabsProps) {
  const tabsToShow = viewingAsMember ? memberTabs : publicTabs;
  const storageKey = `groupTab_${group.slug}_${viewingAsMember ? 'member' : 'public'}`;

  const [activeTab, setActiveTab] = useState<string | null>(null);

  // ✅ Load from storage on mount and when view changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      setActiveTab(saved || tabsToShow[0].key);
    }
  }, [storageKey, viewingAsMember, tabsToShow]);

  if (!activeTab) return null;

  // Save tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, value);
    }
  };

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(e) => handleTabChange(e.value as string)}
      variant="enclosed"
    >
      <Tabs.List mb={4}>
        {tabsToShow.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <Tabs.Trigger key={tab.key} value={tab.key}>
              <HStack>
                <IconComponent size={16} />
                <Text>{tab.label}</Text>
              </HStack>
            </Tabs.Trigger>
          );
        })}
        <Tabs.Indicator />
      </Tabs.List>

      {/* Member Tabs */}
      {viewingAsMember && (
        <>
          <Tabs.Content value="overview">
            <OverviewTab group={group} />
          </Tabs.Content>
          <Tabs.Content value="threadworks">
            <ThreadworksTab group={group} />
          </Tabs.Content>
          <Tabs.Content value="collections">
            <CollectionsTab group={group} />
          </Tabs.Content>
          <Tabs.Content value="members">
            <MembersTab group={group} />
          </Tabs.Content>
        </>
      )}

      {/* Public Tabs */}
      {!viewingAsMember && (
        <>
          <Tabs.Content value="landing">
            <LandingTab group={group} isMember={isMember} onJoinGroup={onJoinGroup} />
          </Tabs.Content>
          <Tabs.Content value="joining">
            <JoiningTab group={group} isMember={isMember} onJoinGroup={onJoinGroup} />
          </Tabs.Content>
        </>
      )}
    </Tabs.Root>
  );
}

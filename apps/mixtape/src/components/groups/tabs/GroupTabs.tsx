// src/components/groups/tabs/GroupTabs.tsx (UPDATED)

"use client";

import { useEffect, useState } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import {
  IconInfoHexagon,
  IconMessages,
  IconCalendar,
  IconSchool,
  IconUsers,
  IconFolderOpen,
  IconList,  // ← NEW: for Noticeboard
} from "@tabler/icons-react";
import { OverviewTab } from "./OverviewTab";
import { ConnectionsTab } from "./ConnectionsTab";
// import { EventsTab } from "./EventsTab";
import { CoursesTab } from "./CoursesTab";
import { MembersTab } from "./MembersTab";
import { FilesTab } from "./FilesTab";
import { NoticeboardTab } from "./NoticeboardTab";  // ← NEW
import { LandingTab } from "./LandingTab";
import { JoiningTab } from "./JoiningTab";

interface GroupTabsProps {
  group: any;
  viewingAsMember: boolean;
  isMember: boolean;
  onJoinGroup?: () => void;
}

const memberTabs = [
  { key: 'overview', label: 'Overview', icon: IconInfoHexagon },
  { key: 'noticeboard', label: 'Noticeboard', icon: IconList },  // ← NEW
  { key: 'connections', label: 'Connections', icon: IconMessages },
  { key: 'events', label: 'Events', icon: IconCalendar },
  { key: 'courses', label: 'Courses', icon: IconSchool },
  { key: 'members', label: 'Members', icon: IconUsers },
  { key: 'files', label: 'Files/Resources', icon: IconFolderOpen },
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
  }, [storageKey, viewingAsMember]);

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
          <Tabs.Content value="noticeboard">
            <NoticeboardTab group={group} />
          </Tabs.Content>
          <Tabs.Content value="connections">
            <ConnectionsTab group={group} />
          </Tabs.Content>
          <Tabs.Content value="events">
            {/* <EventsTab group={group} /> */}
            <Box p={4}>Events tab coming soon!</Box>
          </Tabs.Content>
          <Tabs.Content value="courses">
            <CoursesTab group={group} />
          </Tabs.Content>
          <Tabs.Content value="members">
            <MembersTab group={group} />
          </Tabs.Content>
          <Tabs.Content value="files">
            <FilesTab group={group} />
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
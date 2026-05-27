// apps/mixtape/src/components/groups/tabs/GroupTabs.tsx

"use client";

import { useEffect, useState } from "react";
import { Box, HStack, Image, Link, Text } from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import NextLink from "next/link";
import {
  IconInfoHexagon,
  IconMessages,
  IconUsers,
  IconFolder,
  IconFiles,
} from "@tabler/icons-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { OverviewTab } from "./OverviewTab";
import { ThreadworksTab } from "./ThreadworksTab";
import { MembersTab } from "./MembersTab";
import { CollectionsTab } from "./CollectionsTab";
import { LandingTab } from "./LandingTab";
// import { JoiningTab } from "./JoiningTab";
import { FilesTab } from "./FilesTab";
import type { Group } from "@mixtape/core/types/groupTypes";
import { useColorModeValue } from "@components/ui/color-mode";

interface GroupTabsProps {
  group: Group;
  viewingAsMember: boolean;
  isMember: boolean;
  onJoinGroup?: () => void;
}

const memberTabs = [
  { key: 'overview', label: 'Overview', icon: IconInfoHexagon },
  { key: 'members', label: 'Group Members', icon: IconUsers },
  { key: 'threadworks', label: 'Conversations', icon: IconMessages },
  { key: 'collections', label: 'Content Collections', icon: IconFolder },
  { key: 'files', label: 'Files', icon: IconFiles },
];

const publicTabs = [
  { key: 'landing', label: 'Landing Page', icon: IconInfoHexagon },
];

export function GroupTabs({
  group,
  viewingAsMember,
  onJoinGroup,
}: GroupTabsProps) {
  const { user } = useAuth();
  const panelBg = useColorModeValue("gray.50", "gray.900");
  const tabStripBg = useColorModeValue("gray.100", "gray.800");
  const tabContentBg = useColorModeValue("white", "gray.900");
  const tabBorderColor = useColorModeValue("gray.200", "gray.700");
  const tabTextColor = useColorModeValue("gray.700", "gray.300");
  const tabActiveTextColor = useColorModeValue("gray.900", "gray.100");
  const tabActiveBg = useColorModeValue("white", "gray.700");

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
    <Box
      bg={panelBg}
      borderWidth="1px"
      borderColor={tabBorderColor}
      borderRadius="xl"
      p={{ base: 2, md: 3 }}
    >
      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => handleTabChange(e.value as string)}
        variant="enclosed"
      >
        <HStack
          mb={4}
          bg={tabStripBg}
          borderRadius="lg"
          p={1}
          borderWidth="1px"
          borderColor={tabBorderColor}
          gap={1}
          align="center"
          justify="space-between"
        >
          <Tabs.List gap={1} border="none" bg="transparent" p={0}>
            {tabsToShow.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Tabs.Trigger
                  key={tab.key}
                  value={tab.key}
                  borderRadius="md"
                  px={3}
                  py={2}
                  color={tabTextColor}
                  _selected={{
                    bg: tabActiveBg,
                    color: tabActiveTextColor,
                    borderColor: tabBorderColor,
                  }}
                >
                  <HStack>
                    <IconComponent size={16} />
                    <Text>{tab.label}</Text>
                  </HStack>
                </Tabs.Trigger>
              );
            })}
            <Tabs.Indicator />
          </Tabs.List>

          {/* Me button — visible to members only */}
          {viewingAsMember && user?.username && (
            <Link
              as={NextLink}
              href={`/groups/${group.slug}/me`}
              title="About Me"
              _hover={{ textDecoration: "none" }}
              flexShrink={0}
              mr={1}
            >
              <HStack
                gap={1.5}
                px={2.5}
                py={1.5}
                borderRadius="full"
                border="1px solid"
                borderColor={tabBorderColor}
                bg={tabActiveBg}
                fontSize="sm"
                fontWeight="500"
                color={tabTextColor}
                _hover={{ borderColor: "gray.400" }}
                transition="all 0.15s"
              >
                {user.profile?.avatar_url ? (
                  <Box w="18px" h="18px" borderRadius="full" overflow="hidden" flexShrink={0}>
                    <Image src={user.profile.avatar_url} alt="me" w="full" h="full" objectFit="cover" />
                  </Box>
                ) : (
                  <Box
                    w="18px"
                    h="18px"
                    borderRadius="full"
                    bg="gray.300"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xs"
                    color="gray.600"
                    flexShrink={0}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Box>
                )}
                <Text>Me</Text>
              </HStack>
            </Link>
          )}
        </HStack>

        {/* Member Tabs */}
        {viewingAsMember && (
          <>
            <Tabs.Content value="overview" bg={tabContentBg} borderRadius="lg" p={{ base: 3, md: 4 }}>
              <OverviewTab group={group} onNavigateToTab={handleTabChange} />
            </Tabs.Content>
            <Tabs.Content value="threadworks" bg={tabContentBg} borderRadius="lg" p={{ base: 3, md: 4 }}>
              <ThreadworksTab group={group} />
            </Tabs.Content>
            <Tabs.Content value="collections" bg={tabContentBg} borderRadius="lg" p={{ base: 3, md: 4 }}>
              <CollectionsTab group={group} />
            </Tabs.Content>
            <Tabs.Content value="members" bg={tabContentBg} borderRadius="lg" p={{ base: 3, md: 4 }}>
              <MembersTab group={group} />
            </Tabs.Content>
            <Tabs.Content value="files" bg={tabContentBg} borderRadius="lg" p={{ base: 3, md: 4 }}>
              <FilesTab group={group} />
            </Tabs.Content>
          </>
        )}

        {/* Public Tabs */}
        {!viewingAsMember && (
          <>
            <Tabs.Content value="landing" bg={tabContentBg} borderRadius="lg" p={{ base: 3, md: 4 }}>
              <LandingTab group={group} onJoinGroup={onJoinGroup} />
            </Tabs.Content>
          </>
        )}
      </Tabs.Root>
    </Box>
  );
}

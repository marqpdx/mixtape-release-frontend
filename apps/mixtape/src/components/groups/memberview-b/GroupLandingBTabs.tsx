"use client";

import { useEffect, useState } from "react";
import { Box, HStack, Image, Link, Text } from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import NextLink from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Group } from "@mixtape/core/types/groupTypes";
import { GroupLandingBOverview } from "./GroupLandingBOverview";
import { MembersTab } from "../tabs/MembersTab";
import { ThreadworksTab } from "../tabs/ThreadworksTab";
import { CollectionsTab } from "../tabs/CollectionsTab";

interface GroupLandingBTabsProps {
  group: Group;
}

const memberTabs = [
  { key: "overview", numeral: "I.", label: "Overview" },
  { key: "members", numeral: "II.", label: "Members" },
  { key: "threadworks", numeral: "III.", label: "Conversations" },
  { key: "collections", numeral: "IV.", label: "Collections" },
] as const;

export function GroupLandingBTabs({ group }: GroupLandingBTabsProps) {
  const { user } = useAuth();
  const storageKey = `groupTab_${group.slug}_member`;
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(storageKey);
    setActiveTab(saved || memberTabs[0].key);
  }, [storageKey]);

  if (!activeTab) return null;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, value);
    }
  };

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(event) => handleTabChange(event.value as string)}
      variant="plain"
    >
      <Box
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="theme.border"
        px={{ base: 4, md: 8 }}
        py={3}
        mb={8}
      >
        <HStack align="center" justify="space-between" gap={4} flexWrap="wrap">
          <Tabs.List border="none" bg="transparent" p={0} gap={{ base: 3, md: 6 }} flexWrap="wrap">
            {memberTabs.map((tab) => (
              <Tabs.Trigger
                key={tab.key}
                value={tab.key}
                px={0}
                py={2}
                borderRadius="0"
                color="theme.textSecondary"
                _selected={{
                  color: "theme.text",
                  borderBottom: "2px solid",
                  borderBottomColor: "theme.text",
                }}
              >
                <HStack gap={2} align="baseline">
                  <Text
                    fontFamily="mono"
                    fontSize="10px"
                    letterSpacing="0.12em"
                    textTransform="uppercase"
                    color="inherit"
                  >
                    {tab.numeral}
                  </Text>
                  <Text fontFamily="serifBody" fontSize="md">
                    {tab.label}
                  </Text>
                </HStack>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {user?.username ? (
            <Link
              as={NextLink}
              href={`/groups/${group.slug}/me`}
              _hover={{ textDecoration: "none" }}
            >
              <HStack
                gap={2}
                px={3}
                py={2}
                borderRadius="full"
                borderWidth="1px"
                borderColor="theme.border"
                bg="theme.surface"
              >
                {user.profile?.avatar_url ? (
                  <Box w="20px" h="20px" borderRadius="full" overflow="hidden" flexShrink={0}>
                    <Image src={user.profile.avatar_url} alt="me" w="full" h="full" objectFit="cover" />
                  </Box>
                ) : (
                  <Box
                    w="20px"
                    h="20px"
                    borderRadius="full"
                    bg="theme.border"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xs"
                    color="theme.textSecondary"
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Box>
                )}
                <Text fontSize="sm" color="theme.textSecondary">
                  Me
                </Text>
              </HStack>
            </Link>
          ) : null}
        </HStack>
      </Box>

      <Tabs.Content value="overview">
        <GroupLandingBOverview group={group} onNavigateToTab={handleTabChange} />
      </Tabs.Content>
      <Tabs.Content value="members">
        <MembersTab group={group} />
      </Tabs.Content>
      <Tabs.Content value="threadworks">
        <ThreadworksTab group={group} />
      </Tabs.Content>
      <Tabs.Content value="collections">
        <CollectionsTab group={group} />
      </Tabs.Content>
    </Tabs.Root>
  );
}

"use client";

import { Box, Button, HStack, Image, Link, Text } from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import NextLink from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Group } from "@mixtape/core/types/groupTypes";
import type { GroupMemberViewData } from "../member-views/useGroupMemberViewData";
import { useGroupMemberTabs } from "../member-views/useGroupMemberTabs";
import { GroupLandingBOverview } from "./GroupLandingBOverview";
import { MembersTab } from "../tabs/MembersTab";
import { ThreadworksTab } from "../tabs/ThreadworksTab";
import { CollectionsTab } from "../tabs/CollectionsTab";

interface GroupLandingBTabsProps {
  group: Group;
  viewData: GroupMemberViewData;
}

export function GroupLandingBTabs({ group, viewData }: GroupLandingBTabsProps) {
  const { user } = useAuth();
  const {
    tabs,
    activeTab,
    selectedCollectionId,
    collectionDetailSource,
    handleTabChange,
    openCollectionFromOverview,
    setSelectedCollection,
    returnToOverview,
    showAllCollections,
  } = useGroupMemberTabs(group.slug);

  if (!activeTab) return null;

  const detailBackNav =
    selectedCollectionId && collectionDetailSource === "overview" ? (
      <HStack gap={2} flexWrap="wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={returnToOverview}
          color="theme.textSecondary"
          px={0}
          _hover={{ color: "theme.text" }}
        >
          <IconArrowLeft size={14} />
          <Text ml={1} fontFamily="mono" fontSize="11px" letterSpacing="0.1em" textTransform="uppercase">
            Return to overview
          </Text>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={showAllCollections}
          color="theme.textSecondary"
          px={0}
          _hover={{ color: "theme.text" }}
        >
          <Text fontFamily="mono" fontSize="11px" letterSpacing="0.1em" textTransform="uppercase">
            Show all collections
          </Text>
        </Button>
      </HStack>
    ) : undefined;

  return (
    <Tabs.Root
      className="glbt-root"
      value={activeTab}
      onValueChange={(event) => handleTabChange(event.value as string)}
      variant="plain"
      bg="theme.bgSubtle"
    >
      <Box
        className="glbt-nav"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="theme.border"
        px={{ base: 4, md: 8 }}
        py={3}
        mb={8}
      >
        <HStack align="center" justify="space-between" gap={4} flexWrap="wrap">
          <Tabs.List border="none" bg="transparent" p={0} gap={{ base: 3, md: 6 }} flexWrap="wrap">
            {tabs.map((tab) => (
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
                className="glbt-me-pill"
                gap={2}
                px={3}
                py={2}
                borderRadius="full"
                borderWidth="1px"
                borderColor="theme.border"
                bg="theme.bg"
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

      <Tabs.Content className="glbt-content-overview" value="overview" px="10px" pt={0}>
        <GroupLandingBOverview
          viewData={viewData}
          onNavigateToTab={handleTabChange}
          onOpenCollection={openCollectionFromOverview}
        />
      </Tabs.Content>
      <Tabs.Content className="glbt-content-members" value="members" pt={0}>
        <MembersTab group={group} />
      </Tabs.Content>
      <Tabs.Content className="glbt-content-threadworks" value="threadworks" pt={0}>
        <ThreadworksTab group={group} />
      </Tabs.Content>
      <Tabs.Content className="glbt-content-collections" value="collections" pt={0}>
        <CollectionsTab
          group={group}
          selectedCollectionId={selectedCollectionId}
          onSelectedCollectionIdChange={setSelectedCollection}
          detailBackNav={detailBackNav}
        />
      </Tabs.Content>
    </Tabs.Root>
  );
}

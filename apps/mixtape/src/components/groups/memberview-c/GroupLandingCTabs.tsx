"use client";

import { Box, Button, HStack, IconButton, Image, Link, Text } from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import NextLink from "next/link";
import { IconArrowLeft, IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Group } from "@mixtape/core/types/groupTypes";
import type { GroupMemberViewData } from "../member-views/useGroupMemberViewData";
import { useGroupMemberTabs } from "../member-views/useGroupMemberTabs";
import { GroupLandingCOverview } from "./GroupLandingCOverview";
import { MembersTab } from "../tabs/MembersTab";
import { ThreadworksTab } from "../tabs/ThreadworksTab";
import { CollectionsTab } from "../tabs/CollectionsTab";
import { InfoBlockModal } from "@/components/groups/InfoBlockModal";
import { Tooltip } from "@components/ui/tooltip";

interface GroupLandingCTabsProps {
  group: Group;
  viewData: GroupMemberViewData;
}

export function GroupLandingCTabs({ group, viewData }: GroupLandingCTabsProps) {
  const { user } = useAuth();
  const [infoModalOpen, setInfoModalOpen] = useState(false);
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
      className="glct-root"
      value={activeTab}
      onValueChange={(event) => handleTabChange(event.value as string)}
      variant="plain"
      bg="theme.bgSubtle"
    >
      <Box
        className="glct-nav"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="theme.border"
        px={{ base: 4, md: "44px" }}
        pt={{ base: 3, md: "22px" }}
        pb={0}
        mb={8}
      >
        <HStack align="flex-end" justify="space-between" gap={4} flexWrap="wrap">
          <Tabs.List border="none" bg="transparent" p={0} gap={{ base: 4, md: "30px" }} flexWrap="wrap">
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <Tabs.Trigger
                  key={tab.key}
                  value={tab.key}
                  px={0}
                  py="4px"
                  pb="12px"
                  borderRadius="0"
                  _selected={{
                    borderBottom: "2px solid",
                    borderBottomColor: "theme.accent",
                  }}
                >
                  <Text
                    fontFamily="sans"
                    fontSize="15.5px"
                    fontWeight="600"
                    color={isActive ? "theme.text" : "theme.textMuted"}
                  >
                    {tab.label}
                  </Text>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          <HStack gap={2} pb="9px">
            <Tooltip content="Getting around Crossroads" positioning={{ placement: "bottom" }} showArrow>
              <IconButton
                aria-label="Getting around Crossroads"
                size="xs"
                variant="ghost"
                onClick={() => setInfoModalOpen(true)}
                color="theme.textFaint"
                _hover={{ color: "theme.textSecondary" }}
              >
                <IconInfoCircle size={14} />
              </IconButton>
            </Tooltip>
            {user?.username ? (
              <Link
                as={NextLink}
                href={`/groups/${group.slug}/me`}
                _hover={{ textDecoration: "none" }}
              >
                <HStack
                  className="glct-me-pill"
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
        </HStack>
      </Box>

      <InfoBlockModal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} />

      <Tabs.Content className="glct-content-overview" value="overview" px="10px" pt={0}>
        <GroupLandingCOverview
          viewData={viewData}
          onNavigateToTab={handleTabChange}
          onOpenCollection={openCollectionFromOverview}
        />
      </Tabs.Content>
      <Tabs.Content className="glct-content-members" value="members" pt={0}>
        <MembersTab group={group} />
      </Tabs.Content>
      <Tabs.Content className="glct-content-threadworks" value="threadworks" pt={0}>
        <ThreadworksTab group={group} />
      </Tabs.Content>
      <Tabs.Content className="glct-content-collections" value="collections" pt={0}>
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

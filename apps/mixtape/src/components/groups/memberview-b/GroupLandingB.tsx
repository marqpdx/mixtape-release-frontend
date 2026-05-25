"use client";

import { useMemo } from "react";
import { Box, Button, Flex, Grid, HStack, Image, Link, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import NextLink from "next/link";
import { IconBuildingCommunity, IconCircleDot, IconNetwork, IconUserCircle } from "@tabler/icons-react";
import { getBestEmblemUrl } from "@mixtape/core/types/emblemTypes";
import type { Group } from "@mixtape/core/types/groupTypes";
import { useCollections } from "@mixtape/api/hooks/stackroom/useCollections";
import { useMembers } from "@mixtape/api/hooks";
import { useStall } from "@mixtape/api/hooks/useBazaar";
import { GroupHeaderWrapper } from "../layout/GroupHeaderWrapper";
import { GroupLayoutSwitcher, type GroupLayoutVariant } from "../GroupLayoutSwitcher";
import { GroupLandingBTabs } from "./GroupLandingBTabs";

const GROUP_TYPE_ICONS = {
  community: IconBuildingCommunity,
  circle: IconCircleDot,
  persona: IconUserCircle,
  coalition: IconNetwork,
};

interface GroupLandingBProps {
  group: Group;
  testRole?: "admin" | "member" | "public" | null;
  onRoleChange?: (role: "admin" | "member" | "public") => void;
  isMember?: boolean;
  isAdminOrSteward?: boolean;
  canEditGroup?: boolean;
  layoutVariant?: GroupLayoutVariant;
  onLayoutChange?: (layout: GroupLayoutVariant) => void;
}

function formatFoundedDate(input?: string): string {
  if (!input) return "Recently founded";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "Recently founded";
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function GroupLandingB({
  group,
  testRole,
  onRoleChange,
  isMember = false,
  isAdminOrSteward = false,
  canEditGroup = false,
  layoutVariant = "b",
  onLayoutChange,
}: GroupLandingBProps) {
  const GroupTypeIcon =
    GROUP_TYPE_ICONS[group.group_type as keyof typeof GROUP_TYPE_ICONS] || IconBuildingCommunity;
  const heroImage =
    group.profile_image_url ||
    group.background_image_url ||
    getBestEmblemUrl(group.emblem);
  const foundedLabel = useMemo(() => formatFoundedDate(group.created_at), [group.created_at]);
  const summary = group.summary?.trim() || group.description?.trim() || "This group is still shaping its public summary.";
  const { activeMembers, adminMembers, stewardMembers } = useMembers(group.slug);
  const { collections } = useCollections({ sponsor_type: "group", sponsor_id: group.id });
  const { stall } = useStall("group", group.id);

  const leaderCount = useMemo(() => {
    const stewardsOnly = stewardMembers.filter((member) => !member.roles.includes("admin"));
    return adminMembers.length + stewardsOnly.length;
  }, [adminMembers, stewardMembers]);

  const collectionCount = collections?.length ?? 0;
  const totalItems = collections?.reduce((sum, collection) => sum + (collection.item_count || 0), 0) ?? 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      <Box bg="theme.bg" minH="100vh">
        <GroupHeaderWrapper
          showRoleSwitcher={isMember}
          testRole={testRole}
          onRoleChange={onRoleChange}
          isAdminOrSteward={isAdminOrSteward}
        >
          <Box borderBottomWidth="1px" borderColor="theme.border" bg="theme.bg">
            <Box px={{ base: 4, md: 8, xl: 12 }} pt={{ base: 6, md: 10 }} pb={{ base: 8, md: 12 }}>
              <Flex
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                align={{ base: "flex-start", md: "center" }}
                gap={3}
                pb={4}
                mb={8}
                borderBottom="1px solid"
                borderColor="theme.text"
                color="theme.textSecondary"
                fontFamily="mono"
                fontSize="11px"
                letterSpacing="0.12em"
                textTransform="uppercase"
              >
                <Text>{group.group_type} group</Text>
                <Text>A member view on Mixtape</Text>
                {onLayoutChange ? (
                  <GroupLayoutSwitcher
                    currentLayout={layoutVariant}
                    onLayoutChange={onLayoutChange}
                    ml={0}
                    mb={0}
                  />
                ) : (
                  <Text>Founded {foundedLabel}</Text>
                )}
              </Flex>

              <Grid
                templateColumns={{ base: "1fr", md: "320px minmax(0, 1fr)" }}
                gap={{ base: 8, md: 12 }}
                alignItems="start"
              >
                <Box>
                  {heroImage ? (
                    <Image
                      src={heroImage}
                      alt={`${group.title} cover`}
                      w="100%"
                      h={{ base: "220px", md: "300px" }}
                      objectFit="cover"
                      objectPosition="center"
                      borderRadius="2px"
                      bg="theme.surface"
                    />
                  ) : (
                    <Flex
                      h={{ base: "220px", md: "300px" }}
                      borderWidth="1px"
                      borderStyle="dashed"
                      borderColor="theme.border"
                      borderRadius="sm"
                      align="center"
                      justify="center"
                      direction="column"
                      gap={3}
                    >
                      <GroupTypeIcon size={34} style={{ color: "var(--theme-text-secondary)" }} />
                      {canEditGroup ? (
                        <Link as={NextLink} href={`/groups/${group.slug}?view=admin&section=edit-group`}>
                          <Button size="sm" variant="outline">
                            Add image
                          </Button>
                        </Link>
                      ) : (
                        <Text color="theme.textSecondary">No cover image yet</Text>
                      )}
                    </Flex>
                  )}
                </Box>

                <Flex direction="column" justify="space-between" gap={{ base: 8, xl: 10 }} minW={0}>
                  <Box textAlign="left">
                    <HStack gap={2} mb={4} color="theme.textSecondary">
                      <GroupTypeIcon size={18} />
                      <Text
                        fontFamily="mono"
                        fontSize="11px"
                        letterSpacing="0.12em"
                        textTransform="uppercase"
                      >
                        {group.group_type}
                      </Text>
                    </HStack>
                    <Text
                      as="h1"
                      fontFamily="heading"
                      fontSize={{ base: "3xl", md: "5xl", xl: "6xl" }}
                      lineHeight="0.95"
                      letterSpacing="-0.03em"
                      color="theme.text"
                      mb={5}
                    >
                      {group.title}
                    </Text>
                    <Text
                      fontFamily="serifBody"
                      fontSize={{ base: "lg", md: "xl", xl: "2xl" }}
                      fontStyle="italic"
                      lineHeight="1.45"
                      color="theme.textSecondary"
                      maxW="40rem"
                    >
                      {summary}
                    </Text>
                  </Box>

                  <Grid
                    templateColumns={{ base: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }}
                    gap={0}
                    borderTop="1px solid"
                    borderBottom="1px solid"
                    borderColor="theme.border"
                  >
                    {[
                      ["Members", String(group.member_count || activeMembers.length || 0)],
                      ["Collections", String(collectionCount)],
                      ["Artifacts", String(totalItems)],
                      ["Stewards", String(leaderCount)],
                    ].map(([label, value], index, arr) => (
                      <Box
                        key={label}
                        py={{ base: 3, md: 4 }}
                        px={{ base: 3, md: 4, xl: 5 }}
                        borderRight={index < arr.length - 1 ? "1px solid" : "none"}
                        borderColor="theme.border"
                        textAlign="left"
                      >
                        <Text
                          fontFamily="mono"
                          fontSize="10px"
                          letterSpacing="0.12em"
                          textTransform="uppercase"
                          color="theme.textSecondary"
                        >
                          {label}
                        </Text>
                        <Text fontFamily="serifBody" fontSize={{ base: "xl", md: "2xl" }} color="theme.text">
                          {value}
                        </Text>
                      </Box>
                    ))}
                  </Grid>

                  {stall?.offerings_count ? (
                    <Box pt={1}>
                      <Link as={NextLink} href={`/groups/${group.slug}/stall`}>
                        <Button size="lg" variant="outline">Visit bazaar stall</Button>
                      </Link>
                    </Box>
                  ) : null}
                </Flex>
              </Grid>
            </Box>
          </Box>
        </GroupHeaderWrapper>

        <Box px={{ base: 4, md: 8, xl: 12 }} pt={5} pb={10}>
          <GroupLandingBTabs group={group} />
        </Box>
      </Box>
    </motion.div>
  );
}

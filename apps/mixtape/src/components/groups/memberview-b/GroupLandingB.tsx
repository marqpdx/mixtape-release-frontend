"use client";

import { Box, Button, Flex, Grid, Image, Link, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import NextLink from "next/link";
import { IconBuildingCommunity, IconCircleDot, IconNetwork, IconUserCircle } from "@tabler/icons-react";
import type { Group } from "@mixtape/core/types/groupTypes";
import { GroupHeaderWrapper } from "../layout/GroupHeaderWrapper";
import type { GroupLayoutVariant } from "../GroupLayoutSwitcher";
import { useGroupMemberViewData } from "../member-views/useGroupMemberViewData";
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
  const viewData = useGroupMemberViewData(group);
  const GroupTypeIcon =
    GROUP_TYPE_ICONS[group.group_type as keyof typeof GROUP_TYPE_ICONS] || IconBuildingCommunity;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      <Box className="glb-root" bg="theme.bg" minH="100vh">
        <GroupHeaderWrapper
          showRoleSwitcher={isMember}
          testRole={testRole}
          onRoleChange={onRoleChange}
          isAdminOrSteward={isAdminOrSteward}
          layoutVariant={layoutVariant}
          onLayoutChange={onLayoutChange}
        >
          <Box className="glb-header" borderBottomWidth="1px" borderColor="theme.border" bg="theme.bg">
            <Box className="glb-header-inner" px={{ base: 4, md: 8, xl: 12 }} pt={5} pb={6}>
              <Grid
                className="glb-header-grid"
                templateColumns={{ base: "1fr", md: "320px minmax(0, 1fr)" }}
                gap={{ base: 8, md: 12 }}
                alignItems="stretch"
              >
                <Box className="glb-header-image-col">
                  {viewData.media.heroImage ? (
                    <Image
                      src={viewData.media.heroImage}
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

                <Flex className="glb-header-content-col" direction="column" justify="space-between" gap={0} minW={0}>
                  <Box textAlign="left">
                    <Text
                      as="h1"
                      fontFamily="heading"
                      fontSize={{ base: "3xl", md: "5xl", xl: "6xl" }}
                      lineHeight="0.95"
                      letterSpacing="-0.03em"
                      color="theme.text"
                      mb={5}
                    >
                      {viewData.identity.title}
                    </Text>
                    <Text
                      fontFamily="serifBody"
                      fontSize={{ base: "md", md: "lg", xl: "xl" }}
                      fontStyle="italic"
                      lineHeight="1.45"
                      color="theme.textSecondary"
                      maxW="40rem"
                    >
                      {viewData.copy.summary}
                    </Text>
                  </Box>

                  <Grid
                    className="glb-header-stats"
                    templateColumns={{ base: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }}
                    gap={0}
                    borderTop="1px solid"
                    borderBottom="1px solid"
                    borderColor="theme.border"
                  >
                    {[
                      ["Members", String(viewData.members.memberCount)],
                      ["Collections", String(viewData.collections.count)],
                      ["Artifacts", String(viewData.collections.totalItems)],
                      ["Stewards", String(viewData.members.leaderCount)],
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

                  {viewData.bazaar.offeringsCount ? (
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

        <Box className="glb-body" px={{ base: 4, md: 8, xl: 12 }} pt={5} pb={10}>
          <GroupLandingBTabs group={group} viewData={viewData} />
        </Box>
      </Box>
    </motion.div>
  );
}

// apps/mixtape/src/components/groups/memberview-c/GroupLandingC.tsx

"use client";

import { Box, Flex, HStack, Image, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { IconBuildingCommunity, IconCircleDot, IconNetwork } from "@tabler/icons-react";
import type { Group } from "@mixtape/core/types/groupTypes";
import { GroupHeaderWrapper } from "../layout/GroupHeaderWrapper";
import { useGroupMemberViewData } from "../member-views/useGroupMemberViewData";
import { GroupLandingCTabs } from "./GroupLandingCTabs";

const GROUP_TYPE_ICONS = {
  community: IconBuildingCommunity,
  circle: IconCircleDot,
  coalition: IconNetwork,
};

interface GroupLandingCProps {
  group: Group;
  testRole?: "admin" | "member" | "public" | null;
  onRoleChange?: (role: "admin" | "member" | "public") => void;
  isMember?: boolean;
  isAdminOrSteward?: boolean;
  canEditGroup?: boolean;
}

export function GroupLandingC({
  group,
  testRole,
  onRoleChange,
  isMember = false,
  isAdminOrSteward = false,
  canEditGroup = false,
}: GroupLandingCProps) {
  void canEditGroup;
  const viewData = useGroupMemberViewData(group);
  const GroupTypeIcon =
    GROUP_TYPE_ICONS[group.group_type as keyof typeof GROUP_TYPE_ICONS] || IconBuildingCommunity;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      <Box className="glc-root" bg="theme.bg" minH="100vh">
        <GroupHeaderWrapper
          showRoleSwitcher={isMember}
          testRole={testRole}
          onRoleChange={onRoleChange}
          isAdminOrSteward={isAdminOrSteward}
        >
          <Box className="glc-header" borderBottomWidth="1px" borderColor="theme.border" bg="theme.surface">
            <Flex
              className="glc-header-inner"
              align="center"
              gap={{ base: 6, md: "34px" }}
              px={{ base: 5, md: "44px" }}
              pt={{ base: 6, md: "42px" }}
              pb={{ base: 6, md: "36px" }}
              wrap={{ base: "wrap", md: "nowrap" }}
            >
              {viewData.media.heroImage ? (
                <Image
                  className="glc-cover"
                  src={viewData.media.heroImage}
                  alt={`${group.title} cover`}
                  w={{ base: "120px", md: "204px" }}
                  h={{ base: "120px", md: "204px" }}
                  objectFit="cover"
                  borderRadius="22px"
                  borderWidth="1px"
                  borderColor="theme.border"
                  boxShadow="0 12px 30px rgba(35, 42, 49, 0.16)"
                  flexShrink={0}
                />
              ) : (
                <Flex
                  className="glc-cover-placeholder"
                  w={{ base: "120px", md: "204px" }}
                  h={{ base: "120px", md: "204px" }}
                  borderRadius="22px"
                  borderWidth="1px"
                  borderStyle="dashed"
                  borderColor="theme.border"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <GroupTypeIcon size={40} style={{ color: "var(--theme-text-secondary)" }} />
                </Flex>
              )}

              <Box className="glc-header-text" minW={0}>
                <Text
                  as="h1"
                  fontFamily="heading"
                  fontSize={{ base: "3xl", md: "5xl", xl: "56px" }}
                  lineHeight="1.0"
                  letterSpacing="-0.02em"
                  color="theme.text"
                >
                  {viewData.identity.title}
                </Text>
                <Text
                  fontFamily="serifBody"
                  fontStyle="italic"
                  fontSize={{ base: "md", md: "xl", xl: "23px" }}
                  lineHeight="1.4"
                  color="theme.textSecondary"
                  maxW="56ch"
                  mt="14px"
                >
                  {viewData.copy.summary}
                </Text>
                <HStack className="glc-header-meta" gap="14px" mt="20px" flexWrap="wrap">
                  {/* Self-name pill (design spec field `Group_Self_Name`) waits on a backend
                      field — render it here once `group.self_name` exists; hide when empty. */}
                  <Text
                    as="span"
                    fontFamily="mono"
                    fontSize="11px"
                    letterSpacing="0.16em"
                    textTransform="uppercase"
                    color="theme.textMuted"
                  >
                    {viewData.members.memberCount} members
                  </Text>
                </HStack>
              </Box>
            </Flex>
          </Box>
        </GroupHeaderWrapper>

        <Box className="glc-body" px={{ base: 4, md: 8, xl: 12 }} pt={5} pb={10}>
          <GroupLandingCTabs group={group} viewData={viewData} />
        </Box>
      </Box>
    </motion.div>
  );
}

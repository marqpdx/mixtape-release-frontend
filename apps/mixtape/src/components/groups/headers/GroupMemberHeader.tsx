// src/components/groups/headers/GroupMemberHeader.tsx

"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Badge,
  Image,
  Link,
} from "@chakra-ui/react";
import {
  IconBuildingCommunity,
  IconCircleDot,
  IconUserCircle,
  IconNetwork,
} from "@tabler/icons-react";
import NextLink from "next/link";
import { GroupHeaderWrapper } from "../layout/GroupHeaderWrapper";
import type { GroupMemberViewId } from "../member-views/registry";

const GROUP_TYPE_ICONS = {
  community: IconBuildingCommunity,
  circle: IconCircleDot,
  persona: IconUserCircle,
  coalition: IconNetwork,
};

interface GroupMemberHeaderProps {
  group: {
    title: string;
    slug: string;
    group_type?: string;
    emblem?: { size_96_url?: string | null; url?: string | null } | null;
    profile_image_url?: string;
    member_count?: number;
  };
  testRole?: 'admin' | 'member' | 'public' | null;
  onRoleChange?: (role: 'admin' | 'member' | 'public') => void;
  isAdminOrSteward?: boolean;
  canEditGroup?: boolean;
  layoutVariant?: GroupMemberViewId;
  onLayoutChange?: (layout: GroupMemberViewId) => void;
}

export function GroupMemberHeader({
  group,
  testRole,
  onRoleChange,
  isAdminOrSteward = false,
  canEditGroup = false,
  layoutVariant,
  onLayoutChange,
}: GroupMemberHeaderProps) {
  const cardBg = "theme.bgSecondary";
  const borderColor = "theme.border";

  const GroupTypeIcon = GROUP_TYPE_ICONS[group.group_type as keyof typeof GROUP_TYPE_ICONS] || IconBuildingCommunity;
  const emblemSrc =
    group.emblem?.size_96_url?.trim() ||
    group.emblem?.url?.trim() ||
    group.profile_image_url;

  return (
    <GroupHeaderWrapper
      showRoleSwitcher={true}
      testRole={testRole}
      onRoleChange={onRoleChange}
      isAdminOrSteward={isAdminOrSteward}
      layoutVariant={layoutVariant}
      onLayoutChange={onLayoutChange}
    >
      <Box minW="100vw" bg={cardBg} borderBottomWidth="1px" borderColor={borderColor} py={6}>
        <Container maxW="7xl">
          <Flex alignItems="center" gap={6}>

            {/* Right side: Group emblem */}
            <Flex alignItems="center" gap={3}>
              {emblemSrc ? (
                <Image alt={`${group.title} emblem`} height={"96px"} width={"96px"} src={emblemSrc} />
              ) : canEditGroup ? (
                <Box
                  height="96px"
                  width="96px"
                  borderWidth="1px"
                  borderStyle="dashed"
                  borderColor="theme.border"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  textAlign="center"
                  px={2}
                >
                  <Link as={NextLink} href={`/groups/${group.slug}?view=admin&section=edit-group`}>
                    <Button size="xs" variant="outline">
                      Add image
                    </Button>
                  </Link>
                </Box>
              ) : (
                <Box
                  height="96px"
                  width="96px"
                  borderWidth="1px"
                  borderStyle="dashed"
                  borderColor="theme.border"
                  borderRadius="md"
                />
              )}
            </Flex>

            <Box flex="1">
              <Flex alignItems="center" gap={2} mb={2}>
                <GroupTypeIcon size={24} style={{ color: "var(--theme-text-secondary)" }} />
                <Heading size="2xl">
                  {group.title}
                </Heading>
              </Flex>
              <Flex alignItems="center" gap={4}>
                <Text color="theme.textSecondary" fontSize="lg">
                  {group.member_count || 0} members
                </Text>
                <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                  Active Community
                </Badge>
              </Flex>
            </Box>


          </Flex>
        </Container>
      </Box>
    </GroupHeaderWrapper>
  );
}

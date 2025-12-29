// src/components/groups/permissions/GroupPermissionsWorkArea.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Table,
  Heading,
  Text,
  Flex,
  Badge,
  Button,
  Spinner,
  Checkbox,
  Avatar,
  Collapsible,
} from "@chakra-ui/react";
import { toaster } from "@mixtape/core/lib/toaster";
import {
  useMemberPermissions,
  useAvailablePermissions,
  useGrantPermission,
  useRevokePermission,
} from "@mixtape/api/hooks/groups/useGroupPermissions";

// Data structures
interface User {
  id: string;
  username: string;
  email: string;
  profile?: {
    display_name?: string;
    avatar?: string;
  };
}

interface MemberPermissions {
  userId: string;
  user: User;
  roles: string[]; // ['member', 'steward', 'admin']
  decorators: string[]; // ['can__ManageWriting', 'can__InviteMembers', etc.]
}

interface Permission {
  code: string;
  name: string;
  description: string;
  category: "identity" | "capability" | "policy";
}

interface GroupPermissionsWorkAreaProps {
  groupSlug: string;
  groupId?: string;
  groupTitle?: string;
}

// Define available permissions (will come from API later)
const AVAILABLE_PERMISSIONS: Permission[] = [
  {
    code: "can__ManageWriting",
    name: "Manage Writing",
    description: "Create, edit, and manage writing pieces",
    category: "capability",
  },
  {
    code: "can__ManageDispatch",
    name: "Manage Dispatch",
    description: "Create, edit, and manage dispatch documents",
    category: "capability",
  },
  {
    code: "can__InviteMembers",
    name: "Invite Members",
    description: "Send invitations to new members",
    category: "capability",
  },
  {
    code: "can__CreateSponsoredCircle",
    name: "Create Circles",
    description: "Create Circles sponsored by this Community",
    category: "capability",
  },
];

// Mock data - will be replaced with API call
const MOCK_MEMBERS: MemberPermissions[] = [
  {
    userId: "1",
    user: {
      id: "1",
      username: "alice",
      email: "alice@example.com",
      profile: { display_name: "Alice Admin" },
    },
    roles: ["member", "admin"],
    decorators: [],
  },
  {
    userId: "2",
    user: {
      id: "2",
      username: "bob",
      email: "bob@example.com",
      profile: { display_name: "Bob Writer" },
    },
    roles: ["member", "steward"],
    decorators: ["can__ManageWriting", "can__ManageDispatch"],
  },
  {
    userId: "3",
    user: {
      id: "3",
      username: "charlie",
      email: "charlie@example.com",
      profile: { display_name: "Charlie Member" },
    },
    roles: ["member"],
    decorators: [],
  },
];

export default function GroupPermissionsWorkArea({
  groupSlug,
  groupId,
  groupTitle,
}: GroupPermissionsWorkAreaProps) {
  const [saving, setSaving] = useState<string | null>(null); // userId being saved

  // Fetch data from API
  const { data: members, isLoading: membersLoading } = useMemberPermissions(groupSlug);
  const { data: availablePermissions, isLoading: permsLoading } = useAvailablePermissions(groupSlug);

  // Mutations
  const grantMutation = useGrantPermission(groupSlug);
  const revokeMutation = useRevokePermission(groupSlug);

  // Use available permissions from API or fall back to default
  const permissions = availablePermissions || AVAILABLE_PERMISSIONS;

  // Toggle permission for a user
  const togglePermission = async (userId: string, permissionCode: string) => {
    const member = members?.find((m) => m.user_id === userId);
    if (!member) return;

    // Don't allow changing admin permissions
    if (member.roles.includes("admin")) {
      toaster.create({
        title: "Cannot modify admin permissions",
        description: "Admins have all permissions by default",
        type: "warning",
      });
      return;
    }

    setSaving(userId);

    try {
      // Check if currently has permission
      const hasPermission = member.decorators.includes(permissionCode);

      if (hasPermission) {
        // Revoke permission
        await revokeMutation.mutateAsync({ userId, decorator: permissionCode });

        // Check if this was the last decorator
        const remainingDecorators = member.decorators.filter(d => d !== permissionCode);
        if (remainingDecorators.length === 0 && member.roles.includes("steward")) {
          toaster.create({
            title: "Steward role removed",
            description: `${member.user.profile?.display_name || member.user.username} is now a member`,
            type: "info",
          });
        }
      } else {
        // Grant permission
        await grantMutation.mutateAsync({ userId, decorator: permissionCode });

        // Check if this is the first decorator
        if (member.decorators.length === 0 && !member.roles.includes("steward")) {
          toaster.create({
            title: "Member promoted to Steward",
            description: `${member.user.profile?.display_name || member.user.username} now has steward role`,
            type: "success",
          });
        }
      }
    } catch (error) {
      console.error("Failed to toggle permission:", error);
    } finally {
      setSaving(null);
    }
  };

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes("admin")) {
      return (
        <Badge colorPalette="red" size="sm">
          Admin
        </Badge>
      );
    }
    if (roles.includes("steward")) {
      return (
        <Badge colorPalette="blue" size="sm">
          Steward
        </Badge>
      );
    }
    return (
      <Badge colorPalette="gray" size="sm">
        Member
      </Badge>
    );
  };

  const loading = membersLoading || permsLoading;

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={4} color="gray.500">
          Loading permissions...
        </Text>
      </Box>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500">No members found</Text>
      </Box>
    );
  }

  return (
    <Box maxW="6xl" mx="auto" py={10} px={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Member Permissions
          </Heading>
          <Text color="gray.600">
            Grant steward permissions to group members
          </Text>
        </Box>
      </Flex>

      {/* Permissions Legend */}
      <Box mb={6}>
        <Collapsible.Root>
          <Collapsible.Trigger asChild>
            <Button
              variant="outline"
              size="sm"
              width="full"
              justifyContent="space-between"
            >
              <Flex align="center" gap={2}>
                <Text>📋</Text>
                <Text>Available Permissions</Text>
              </Flex>
              <Collapsible.Indicator />
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Box mt={2} p={4} bg="gray.50" borderRadius="md">
              <Flex direction="column" gap={2}>
                {permissions.map((perm) => (
                  <Box key={perm.code}>
                    <Text fontWeight="semibold" fontSize="sm">
                      {perm.name}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {perm.description}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>

      {/* Permissions Matrix */}
      <Box borderWidth={1} borderRadius="lg" overflow="hidden">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row bg="gray.100">
              <Table.ColumnHeader width="300px">Member</Table.ColumnHeader>
              <Table.ColumnHeader width="120px">Role</Table.ColumnHeader>
              {permissions.map((perm) => (
                <Table.ColumnHeader key={perm.code} textAlign="center">
                  {perm.name}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {members.map((member) => {
              const isAdmin = member.roles.includes("admin");
              const isSaving = saving === member.user_id;

              return (
                <Table.Row key={member.user_id}>
                  {/* Member Info */}
                  <Table.Cell>
                    <Flex align="center" gap={3}>
                      <Avatar.Root size="sm">
                        {member.user.profile?.avatar ? (
                          <Avatar.Image
                            src={member.user.profile.avatar}
                            alt={
                              member.user.profile?.display_name ||
                              member.user.username
                            }
                          />
                        ) : (
                          <Avatar.Fallback>
                            {(
                              member.user.profile?.display_name ||
                              member.user.username
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </Avatar.Fallback>
                        )}
                      </Avatar.Root>
                      <Box>
                        <Text fontWeight="medium">
                          {member.user.profile?.display_name ||
                            member.user.username}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {member.user.email}
                        </Text>
                      </Box>
                    </Flex>
                  </Table.Cell>

                  {/* Role Badge */}
                  <Table.Cell>{getRoleBadge(member.roles)}</Table.Cell>

                  {/* Permission Checkboxes */}
                  {permissions.map((perm) => (
                    <Table.Cell key={perm.code} textAlign="center">
                      <Flex justify="center" align="center">
                        {isSaving ? (
                          <Spinner size="sm" />
                        ) : (
                          <Checkbox.Root
                            checked={
                              isAdmin ||
                              member.decorators.includes(perm.code)
                            }
                            disabled={isAdmin}
                            onCheckedChange={() =>
                              togglePermission(member.user_id, perm.code)
                            }
                            aria-label={perm.name}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Root>
                        )}
                      </Flex>
                    </Table.Cell>
                  ))}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Admin Note */}
      <Box mt={4} p={3} bg="blue.50" borderRadius="md">
        <Text fontSize="sm" color="blue.800">
          <strong>Note:</strong> Admins have all permissions by default and
          cannot be modified here. When a member is granted their first
          permission, they are automatically promoted to Steward.
        </Text>
      </Box>
    </Box>
  );
}

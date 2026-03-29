// apps/mixtape/src/components/groups/permissions/GroupPermissionsWorkArea.tsx

"use client";

import { useState } from "react";
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
  useGrantRole,
  useRevokeRole,
  useRevokePermission,
} from "@mixtape/api/hooks/groups/useGroupPermissions";

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
  {
    code: "can__ManageThreadworks",
    name: "Manage Threadworks",
    description: "Create, edit, and manage forums and discussions",
    category: "capability",
  },
  {
    code: "can__ManageAlmanac",
    name: "Manage Almanac",
    description: "Create and manage events and calendar items",
    category: "capability",
  },
  {
    code: "can__ManageCollections",
    name: "Manage Collections",
    description: "Create and manage collections and exhibitions",
    category: "capability",
  },
  {
    code: "can__ManageLanternmail",
    name: "Manage Lanternmail",
    description: "Create, edit, and manage mailing lists",
    category: "capability",
  },
];

export default function GroupPermissionsWorkArea({
  groupSlug,
  groupId,
  groupTitle,
}: GroupPermissionsWorkAreaProps) {
  void groupId;
  void groupTitle;
  const [saving, setSaving] = useState<string | null>(null); // userId being saved
  const [roleSaving, setRoleSaving] = useState<string | null>(null);

  // Fetch data from API
  const { data: members, isLoading: membersLoading } = useMemberPermissions(groupSlug);
  const { data: availablePermissions, isLoading: permsLoading } = useAvailablePermissions(groupSlug);

  // Mutations
  const grantMutation = useGrantPermission(groupSlug);
  const revokeMutation = useRevokePermission(groupSlug);
  const grantRoleMutation = useGrantRole(groupSlug);
  const revokeRoleMutation = useRevokeRole(groupSlug);

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

  const grantAdminRole = async (userId: string) => {
    setRoleSaving(userId);
    try {
      await grantRoleMutation.mutateAsync({ userId, role: "admin" });
      toaster.create({
        title: "Member promoted to Admin",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to grant admin role:", error);
    } finally {
      setRoleSaving(null);
    }
  };

  const revokeAdminRole = async (userId: string) => {
    setRoleSaving(userId);
    try {
      await revokeRoleMutation.mutateAsync({ userId, role: "admin" });
      toaster.create({
        title: "Admin role rescinded",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to revoke admin role:", error);
    } finally {
      setRoleSaving(null);
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
                  <Table.Cell>
                    <Flex align="center" gap={2}>
                      {getRoleBadge(member.roles)}
                      {!isAdmin ? (
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="red"
                          onClick={() => grantAdminRole(member.user_id)}
                          disabled={roleSaving === member.user_id}
                        >
                          {roleSaving === member.user_id ? "Saving..." : "Make Admin"}
                        </Button>
                      ) : (
                        !member.roles.includes("owner") && (
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="orange"
                            onClick={() => revokeAdminRole(member.user_id)}
                            disabled={roleSaving === member.user_id}
                          >
                            {roleSaving === member.user_id ? "Saving..." : "Rescind Admin"}
                          </Button>
                        )
                      )}
                    </Flex>
                  </Table.Cell>

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
          cannot have per-permission toggles changed here. When a member is granted their first
          permission, they are automatically promoted to Steward.
        </Text>
      </Box>
    </Box>
  );
}

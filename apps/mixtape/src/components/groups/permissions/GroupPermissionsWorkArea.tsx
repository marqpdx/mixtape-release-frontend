// apps/mixtape/src/components/groups/permissions/GroupPermissionsWorkArea.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
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
  usePermissionProfiles,
  useCreatePermissionProfile,
  useGrantPermission,
  useGrantRole,
  useGrantHelper,
  useRevokeRole,
  useRevokeHelper,
  useRevokePermission,
  useAssignPermissionProfile,
  useClonePermissionProfile,
  useSetDefaultPermissionProfile,
  useUpdatePermissionProfile,
} from "@mixtape/api/hooks/groups/useGroupPermissions";
import type {
  GroupPermissionProfile,
  MemberPermissions,
} from "@mixtape/api/clients/group/groupPermsApi";

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
    code: "can__PostToStoryline",
    name: "Post to Storyline",
    description: "Create Storyline posts in this group",
    category: "capability",
  },
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

const PERMISSION_LABEL_OVERRIDES: Record<string, string> = {
  can__InviteMembers: "Invite to Group",
};

export default function GroupPermissionsWorkArea({
  groupSlug,
  groupId,
  groupTitle,
}: GroupPermissionsWorkAreaProps) {
  void groupId;
  void groupTitle;
  const [saving, setSaving] = useState<string | null>(null); // userId being saved
  const [roleSaving, setRoleSaving] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDescription, setNewProfileDescription] = useState("");
  const [profileDraftName, setProfileDraftName] = useState("");
  const [profileDraftDescription, setProfileDraftDescription] = useState("");
  const [profileDraftDecorators, setProfileDraftDecorators] = useState<string[]>([]);

  // Fetch data from API
  const { data: members, isLoading: membersLoading } = useMemberPermissions(groupSlug);
  const { data: availablePermissions, isLoading: permsLoading } = useAvailablePermissions(groupSlug);
  const { data: profiles, isLoading: profilesLoading } = usePermissionProfiles(groupSlug);

  // Mutations
  const grantMutation = useGrantPermission(groupSlug);
  const revokeMutation = useRevokePermission(groupSlug);
  const grantRoleMutation = useGrantRole(groupSlug);
  const revokeRoleMutation = useRevokeRole(groupSlug);
  const grantHelperMutation = useGrantHelper(groupSlug);
  const revokeHelperMutation = useRevokeHelper(groupSlug);
  const assignProfileMutation = useAssignPermissionProfile(groupSlug);
  const createProfileMutation = useCreatePermissionProfile(groupSlug);
  const updateProfileMutation = useUpdatePermissionProfile(groupSlug);
  const cloneProfileMutation = useClonePermissionProfile(groupSlug);
  const setDefaultProfileMutation = useSetDefaultPermissionProfile(groupSlug);

  // Use available permissions from API or fall back to default
  const permissions = availablePermissions || AVAILABLE_PERMISSIONS;
  const visiblePermissions = useMemo(
    () =>
      permissions.map((permission) => ({
        ...permission,
        name: PERMISSION_LABEL_OVERRIDES[permission.code] || permission.name,
      })),
    [permissions],
  );
  const sortedProfiles = useMemo(
    () => [...(profiles || [])].sort((a, b) => a.sort_order - b.sort_order),
    [profiles],
  );
  const selectedProfile = sortedProfiles.find((profile) => profile.id === selectedProfileId) || null;

  useEffect(() => {
    if (!sortedProfiles.length) {
      setSelectedProfileId(null);
      return;
    }

    if (!selectedProfileId || !sortedProfiles.some((profile) => profile.id === selectedProfileId)) {
      setSelectedProfileId(sortedProfiles[0].id);
    }
  }, [selectedProfileId, sortedProfiles]);

  useEffect(() => {
    if (!selectedProfile) {
      setProfileDraftName("");
      setProfileDraftDescription("");
      setProfileDraftDecorators([]);
      return;
    }

    setProfileDraftName(selectedProfile.name);
    setProfileDraftDescription(selectedProfile.description || "");
    setProfileDraftDecorators(selectedProfile.decorators);
  }, [selectedProfile]);

  const getMemberDisplayName = (member: MemberPermissions) =>
    member.user?.profile?.display_name || member.user?.username || "Unknown member";

  const getMemberEmail = (member: MemberPermissions) =>
    member.user?.email || "No email available";

  const getMemberAvatar = (member: MemberPermissions) =>
    member.user?.profile?.avatar;

  const getProfileName = (profile: MemberPermissions["permission_profile"]) =>
    profile?.name || "No profile";

  const isCustomized = (
    member: MemberPermissions,
    availableProfiles: GroupPermissionProfile[] | undefined,
  ) => {
    const profile = availableProfiles?.find(
      (candidate) => candidate.id === member.permission_profile?.id
    );
    if (!profile) return member.decorators.length > 0;

    const profileDecorators = [...profile.decorators].sort();
    const memberDecorators = [...member.decorators].sort();
    if (profileDecorators.length !== memberDecorators.length) return true;
    return profileDecorators.some((code, index) => code !== memberDecorators[index]);
  };

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
            description: `${getMemberDisplayName(member)} is now a member`,
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
            description: `${getMemberDisplayName(member)} now has steward role`,
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

  const toggleHelperRole = async (member: MemberPermissions) => {
    setRoleSaving(member.user_id);
    try {
      if (member.is_helper) {
        await revokeHelperMutation.mutateAsync({ userId: member.user_id });
      } else {
        await grantHelperMutation.mutateAsync({ userId: member.user_id });
      }
    } catch (error) {
      console.error("Failed to toggle helper role:", error);
    } finally {
      setRoleSaving(null);
    }
  };

  const updatePermissionProfile = async (
    userId: string,
    profileId: string | null,
  ) => {
    setProfileSaving(userId);
    try {
      await assignProfileMutation.mutateAsync({ userId, profileId });
    } catch (error) {
      console.error("Failed to assign permission profile:", error);
    } finally {
      setProfileSaving(null);
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

  const loading = membersLoading || permsLoading || profilesLoading;

  const toggleDraftDecorator = (decoratorCode: string) => {
    setProfileDraftDecorators((current) =>
      current.includes(decoratorCode)
        ? current.filter((code) => code !== decoratorCode)
        : [...current, decoratorCode]
    );
  };

  const createPermissionProfile = async () => {
    const name = newProfileName.trim();
    if (!name) return;

    const created = await createProfileMutation.mutateAsync({
      name,
      description: newProfileDescription.trim(),
      decorators: [],
    });
    setNewProfileName("");
    setNewProfileDescription("");
    setSelectedProfileId(created.id);
  };

  const saveSelectedProfile = async () => {
    if (!selectedProfile) return;

    const updated = await updateProfileMutation.mutateAsync({
      profileId: selectedProfile.id,
      payload: {
        name: profileDraftName.trim(),
        description: profileDraftDescription.trim(),
        decorators: profileDraftDecorators,
      },
    });
    setSelectedProfileId(updated.id);
  };

  const cloneSelectedProfile = async () => {
    if (!selectedProfile) return;
    const created = await cloneProfileMutation.mutateAsync({
      profileId: selectedProfile.id,
    });
    setSelectedProfileId(created.id);
  };

  const setDefaultProfile = async () => {
    if (!selectedProfile || selectedProfile.is_default) return;
    await setDefaultProfileMutation.mutateAsync({
      profileId: selectedProfile.id,
    });
  };

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
            Grant permissions and temporary helper access to group members
          </Text>
        </Box>
      </Flex>

      <Box mb={6} p={4} borderWidth={1} borderRadius="lg">
        <Heading size="md" mb={4}>
          Permission Profiles
        </Heading>
        <Flex gap={6} align="start" direction={{ base: "column", lg: "row" }}>
          <Box flex="0 0 280px" w="full">
            <Text fontSize="sm" color="gray.600" mb={3}>
              Profiles define default capabilities for members. Assign them per member below.
            </Text>
            <Flex direction="column" gap={2}>
              {sortedProfiles.map((profile) => (
                <Button
                  key={profile.id}
                  variant={selectedProfileId === profile.id ? "solid" : "outline"}
                  justifyContent="space-between"
                  onClick={() => setSelectedProfileId(profile.id)}
                >
                  <span>{profile.name}</span>
                  {profile.is_default ? (
                    <Badge colorPalette="green" size="sm">
                      Default
                    </Badge>
                  ) : null}
                </Button>
              ))}
            </Flex>

            <Box mt={4} pt={4} borderTopWidth={1}>
              <Text fontWeight="medium" mb={2}>
                Create Profile
              </Text>
              <Flex direction="column" gap={2}>
                <input
                  value={newProfileName}
                  onChange={(event) => setNewProfileName(event.target.value)}
                  placeholder="Profile name"
                  style={{
                    fontSize: "14px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                  }}
                />
                <textarea
                  value={newProfileDescription}
                  onChange={(event) => setNewProfileDescription(event.target.value)}
                  placeholder="Description"
                  rows={3}
                  style={{
                    fontSize: "14px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                    resize: "vertical",
                  }}
                />
                <Button
                  size="sm"
                  onClick={createPermissionProfile}
                  loading={createProfileMutation.isPending}
                  disabled={!newProfileName.trim()}
                >
                  Add Profile
                </Button>
              </Flex>
            </Box>
          </Box>

          <Box flex="1" w="full">
            {selectedProfile ? (
              <Flex direction="column" gap={4}>
                <Flex justify="space-between" align="start" gap={4} wrap="wrap">
                  <Box>
                    <Heading size="sm" mb={1}>
                      Edit Profile
                    </Heading>
                    <Text fontSize="sm" color="gray.600">
                      Changes here resync every member assigned to this profile.
                    </Text>
                  </Box>
                  <Flex gap={2} wrap="wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cloneSelectedProfile}
                      loading={cloneProfileMutation.isPending}
                    >
                      Clone
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={setDefaultProfile}
                      loading={setDefaultProfileMutation.isPending}
                      disabled={selectedProfile.is_default}
                    >
                      {selectedProfile.is_default ? "Default Profile" : "Set Default"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveSelectedProfile}
                      loading={updateProfileMutation.isPending}
                      disabled={!profileDraftName.trim()}
                    >
                      Save Profile
                    </Button>
                  </Flex>
                </Flex>

                <Flex direction="column" gap={3}>
                  <input
                    value={profileDraftName}
                    onChange={(event) => setProfileDraftName(event.target.value)}
                    placeholder="Profile name"
                    style={{
                      fontSize: "14px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                    }}
                  />
                  <textarea
                    value={profileDraftDescription}
                    onChange={(event) => setProfileDraftDescription(event.target.value)}
                    placeholder="Profile description"
                    rows={3}
                    style={{
                      fontSize: "14px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      resize: "vertical",
                    }}
                  />
                </Flex>

                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Included permissions
                  </Text>
                  <Flex wrap="wrap" gap={3}>
                    {visiblePermissions.map((perm) => (
                      <Box
                        key={`profile-${selectedProfile.id}-${perm.code}`}
                        minW="240px"
                        p={3}
                        borderWidth={1}
                        borderRadius="md"
                      >
                        <Flex align="start" gap={2}>
                          <Checkbox.Root
                            checked={profileDraftDecorators.includes(perm.code)}
                            onCheckedChange={() => toggleDraftDecorator(perm.code)}
                            mt={1}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Root>
                          <Box>
                            <Text fontWeight="medium" fontSize="sm">
                              {perm.name}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {perm.description}
                            </Text>
                          </Box>
                        </Flex>
                      </Box>
                    ))}
                  </Flex>
                </Box>
              </Flex>
            ) : (
              <Text color="gray.500">Create a profile to begin.</Text>
            )}
          </Box>
        </Flex>
      </Box>

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
                {visiblePermissions.map((perm) => (
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
        <Box
          px={4}
          py={3}
          borderBottomWidth={1}
          bg="gray.50"
        >
          <Text fontSize="sm" color="gray.600">
            Scroll right to manage member-specific permissions. Member, role, and profile stay pinned while you review capabilities.
          </Text>
        </Box>
        <Box overflowX="auto">
          <Table.Root size="sm" minW="1100px">
            <Table.Header>
              <Table.Row bg="gray.100">
                <Table.ColumnHeader
                  width="300px"
                  minW="300px"
                  position="sticky"
                  left="0"
                  zIndex={3}
                  bg="gray.100"
                  boxShadow="1px 0 0 rgba(0, 0, 0, 0.08)"
                >
                  Member
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  width="160px"
                  minW="160px"
                  position="sticky"
                  left="300px"
                  zIndex={3}
                  bg="gray.100"
                  boxShadow="1px 0 0 rgba(0, 0, 0, 0.08)"
                >
                  Role
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  width="240px"
                  minW="240px"
                  position="sticky"
                  left="460px"
                  zIndex={3}
                  bg="gray.100"
                  boxShadow="1px 0 0 rgba(0, 0, 0, 0.08)"
                >
                  Profile
                </Table.ColumnHeader>
                {visiblePermissions.map((perm) => (
                  <Table.ColumnHeader key={perm.code} textAlign="center" minW="140px">
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
                    <Table.Cell
                      position="sticky"
                      left="0"
                      zIndex={2}
                      bg="white"
                      minW="300px"
                      boxShadow="1px 0 0 rgba(0, 0, 0, 0.08)"
                    >
                      <Flex align="center" gap={3}>
                        <Avatar.Root size="sm">
                          {getMemberAvatar(member) ? (
                            <Avatar.Image
                              src={getMemberAvatar(member)}
                              alt={
                                getMemberDisplayName(member)
                              }
                            />
                          ) : (
                            <Avatar.Fallback>
                              {getMemberDisplayName(member)
                                .charAt(0)
                                .toUpperCase()}
                            </Avatar.Fallback>
                          )}
                        </Avatar.Root>
                        <Box>
                          <Text fontWeight="medium">
                            {getMemberDisplayName(member)}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {getMemberEmail(member)}
                          </Text>
                        </Box>
                      </Flex>
                    </Table.Cell>

                    {/* Role Badge */}
                    <Table.Cell
                      position="sticky"
                      left="300px"
                      zIndex={2}
                      bg="white"
                      minW="160px"
                      boxShadow="1px 0 0 rgba(0, 0, 0, 0.08)"
                    >
                      <Flex align="center" gap={2} wrap="wrap">
                        {getRoleBadge(member.roles)}
                        {!isAdmin ? (
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="red"
                            onClick={() => grantAdminRole(member.user_id)}
                            disabled={roleSaving === member.user_id}
                          >
                            {roleSaving === member.user_id ? "..." : "Make admin"}
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
                              {roleSaving === member.user_id ? "..." : "Remove admin"}
                            </Button>
                          )
                        )}
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme={member.is_helper ? "orange" : "gray"}
                          onClick={() => toggleHelperRole(member)}
                          disabled={roleSaving === member.user_id}
                        >
                          {roleSaving === member.user_id ? "..." : "Helper"}
                        </Button>
                      </Flex>
                    </Table.Cell>

                    <Table.Cell
                      position="sticky"
                      left="460px"
                      zIndex={2}
                      bg="white"
                      minW="240px"
                      boxShadow="1px 0 0 rgba(0, 0, 0, 0.08)"
                    >
                      <Flex direction="column" gap={2}>
                        <Text fontSize="sm" fontWeight="medium">
                          {getProfileName(member.permission_profile)}
                        </Text>
                        <Flex align="center" gap={2} wrap="wrap">
                          <select
                            value={member.permission_profile?.id || ""}
                            onChange={(event) =>
                              updatePermissionProfile(
                                member.user_id,
                                event.target.value || null,
                              )
                            }
                            disabled={profileSaving === member.user_id}
                            style={{
                              fontSize: "12px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #D1D5DB",
                              background: "white",
                            }}
                          >
                            <option value="">No profile</option>
                            {(profiles || []).map((profile) => (
                              <option key={profile.id} value={profile.id}>
                                {profile.name}
                                {profile.is_default ? " (Default)" : ""}
                              </option>
                            ))}
                          </select>
                          {profileSaving === member.user_id && <Spinner size="sm" />}
                          {isCustomized(member, profiles) && (
                            <Badge colorPalette="orange" size="sm">
                              Customized
                            </Badge>
                          )}
                        </Flex>
                      </Flex>
                    </Table.Cell>

                    {/* Permission Checkboxes */}
                    {visiblePermissions.map((perm) => (
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

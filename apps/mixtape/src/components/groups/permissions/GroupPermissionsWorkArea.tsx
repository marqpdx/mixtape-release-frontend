// apps/mixtape/src/components/groups/permissions/GroupPermissionsWorkArea.tsx
// Two-pane member permissions redesign — see zzz/PermsRedo for design handoff

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
  Checkbox,
} from "@chakra-ui/react";
import { ChevronRight, ShieldCheck, Info } from "lucide-react";
import { toaster } from "@mixtape/core/lib/toaster";
import {
  useMemberPermissions,
  useAvailablePermissions,
  usePermissionProfiles,
  useCreatePermissionProfile,
  useGrantPermission,
  useRevokePermission,
  useAssignPermissionProfile,
  useClonePermissionProfile,
  useUpdatePermissionProfile,
} from "@mixtape/api/hooks/groups/useGroupPermissions";
import type {
  GroupPermissionProfile,
  MemberPermissions,
  Permission,
} from "@mixtape/api/clients/group/groupPermsApi";
import { useColorModeValue } from "@components/ui/color-mode";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupPermissionsWorkAreaProps {
  groupSlug: string;
  groupId?: string;
  groupTitle?: string;
  circleMode?: boolean;
}

type ActiveTab = "members" | "profiles";

// ─── Permission category mapping ─────────────────────────────────────────────

const PERM_CATEGORY_MAP: Record<string, string> = {
  can__PostToStoryline: "content",
  can__ManageWriting: "content",
  can__ManageDispatch: "content",
  can__ManageCollections: "content",
  can__ManageThreadworks: "content",
  can__InviteMembers: "community",
  can__CreateSponsoredCircle: "community",
  can__ManageAlmanac: "community",
  can__ManageLanternmail: "communications",
  can__EditGroup: "settings",
  can__AddCollection: "content",
};

const CATEGORY_LABELS: { key: string; label: string }[] = [
  { key: "content", label: "Content & Publishing" },
  { key: "community", label: "Community & Members" },
  { key: "communications", label: "Communications" },
  { key: "settings", label: "Settings & Admin" },
];

// Used in circle mode to restrict shown permissions
const CIRCLE_PERMISSION_CODES = new Set([
  "can__PostToStoryline",
  "can__ManageThreadworks",
  "can__InviteMembers",
  "can__ManageAlmanac",
]);

// Fallback list used if API hasn't returned available permissions yet
const FALLBACK_PERMISSIONS: Permission[] = [
  { code: "can__PostToStoryline", name: "Post to Storyline", description: "Create Storyline posts in this group", category: "capability" },
  { code: "can__ManageWriting", name: "Manage Writing", description: "Create, edit, and manage writing pieces", category: "capability" },
  { code: "can__ManageDispatch", name: "Manage Dispatch", description: "Create, edit, and manage dispatch documents", category: "capability" },
  { code: "can__InviteMembers", name: "Invite to Group", description: "Send invitations to new members", category: "capability" },
  { code: "can__CreateSponsoredCircle", name: "Create Circles", description: "Create Circles sponsored by this Community", category: "capability" },
  { code: "can__ManageThreadworks", name: "Manage Threadworks", description: "Create, edit, and manage forums and discussions", category: "capability" },
  { code: "can__ManageAlmanac", name: "Manage Almanac", description: "Create and manage events and calendar items", category: "capability" },
  { code: "can__ManageCollections", name: "Manage Collections", description: "Create and manage collections and exhibitions", category: "capability" },
  { code: "can__ManageLanternmail", name: "Manage Lanternmail", description: "Create, edit, and manage mailing lists", category: "capability" },
  { code: "can__EditGroup", name: "Edit Group", description: "Edit group settings and details", category: "capability" },
  { code: "can__AddCollection", name: "Add Collection", description: "Create new collections in this group", category: "capability" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPrimaryRole(roles: string[]): string {
  if (roles.includes("owner")) return "admin"; // display owners as admin
  if (roles.includes("admin")) return "admin";
  if (roles.includes("steward")) return "steward";
  return "member";
}

function getMemberDisplayName(m: MemberPermissions) {
  return m.user?.profile?.display_name || m.user?.username || "Unknown";
}

function getMemberEmail(m: MemberPermissions) {
  return m.user?.email || "";
}

// ─── Role color tokens ────────────────────────────────────────────────────────

const ROLE_COLORS = {
  admin: { avatarBg: "#f3d9d9", avatarFg: "#a23b3b", badgeBg: "#fde7e7", badgeFg: "#c0392b", label: "Admin" },
  steward: { avatarBg: "#d8e3f7", avatarFg: "#385ea8", badgeBg: "#e6edfb", badgeFg: "#2f5fc0", label: "Steward" },
  member: { avatarBg: "#e2e6ec", avatarFg: "#5a6573", badgeBg: "#eef1f4", badgeFg: "#5a6573", label: "Member" },
} as const;

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────

function ToggleSwitch({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <Box
      as="button"
      w="38px"
      h="22px"
      borderRadius="full"
      position="relative"
      flexShrink={0}
      onClick={disabled ? undefined : onToggle}
      cursor={disabled ? "default" : "pointer"}
      bg={on ? "#1f8a52" : "#cdd4dd"}
      style={{ transition: "background 0.15s" }}
      aria-pressed={on}
      _focus={{ outline: "2px solid", outlineColor: "green.400", outlineOffset: "2px" }}
    >
      <Box
        position="absolute"
        top="2px"
        left={on ? "18px" : "2px"}
        w="18px"
        h="18px"
        borderRadius="full"
        bg="white"
        boxShadow="0 1px 2px rgba(0,0,0,.2)"
        style={{ transition: "left 0.15s" }}
      />
    </Box>
  );
}

// ─── RoleAvatar ───────────────────────────────────────────────────────────────

function RoleAvatar({ name, role, size = "36px", fontSize = "14px" }: { name: string; role: string; size?: string; fontSize?: string }) {
  const colors = ROLE_COLORS[role as keyof typeof ROLE_COLORS] ?? ROLE_COLORS.member;
  return (
    <Box
      w={size}
      h={size}
      borderRadius="full"
      bg={colors.avatarBg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Text fontSize={fontSize} fontWeight="700" color={colors.avatarFg} userSelect="none">
        {name[0]?.toUpperCase() ?? "?"}
      </Text>
    </Box>
  );
}

// ─── RoleBadge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const colors = ROLE_COLORS[role as keyof typeof ROLE_COLORS] ?? ROLE_COLORS.member;
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      px="7px"
      py="2px"
      borderRadius="full"
      fontSize="12px"
      fontWeight="600"
      bg={colors.badgeBg}
      color={colors.badgeFg}
    >
      {colors.label}
    </Box>
  );
}

// ─── CapabilityGrid ───────────────────────────────────────────────────────────
// Shared between Members tab (live toggles) and Profiles tab (profile editor toggles)

interface CapabilityGridProps {
  permissions: Permission[];
  enabledCodes: string[];
  onToggle: (code: string) => void;
  readOnly?: boolean;
}

function CapabilityGrid({ permissions, enabledCodes, onToggle, readOnly }: CapabilityGridProps) {
  const totalEnabled = permissions.filter(p => enabledCodes.includes(p.code)).length;

  const grouped = useMemo(() => {
    return CATEGORY_LABELS
      .map(cat => ({
        ...cat,
        perms: permissions.filter(p => (PERM_CATEGORY_MAP[p.code] ?? "settings") === cat.key),
      }))
      .filter(cat => cat.perms.length > 0);
  }, [permissions]);

  return (
    <Box px={6} pb={6} pt={2}>
      <Text fontSize="13.5px" color="#6b7685" mb={4}>
        <Text as="span" fontWeight="700" color="#1f8a52">{totalEnabled}</Text>
        {" of "}{permissions.length} capabilities enabled
      </Text>

      <VStack gap={5} align="stretch">
        {grouped.map(cat => {
          const catEnabled = cat.perms.filter(p => enabledCodes.includes(p.code)).length;
          return (
            <Box key={cat.key} className={`cpg-cat-${cat.key}`}>
              {/* Category header */}
              <Flex align="center" gap={3} mb={2}>
                <Text
                  fontSize="11.5px"
                  fontWeight="700"
                  letterSpacing="0.07em"
                  color="#9aa3af"
                  textTransform="uppercase"
                  whiteSpace="nowrap"
                  flexShrink={0}
                >
                  {cat.label}
                </Text>
                <Box flex={1} h="1px" bg="#eef1f4" />
                <Text fontSize="12px" color="#aeb6c2" flexShrink={0}>
                  {catEnabled}/{cat.perms.length}
                </Text>
              </Flex>

              {/* 2-col permission cards */}
              <Grid templateColumns="1fr 1fr" gap={2}>
                {cat.perms.map(perm => {
                  const isOn = enabledCodes.includes(perm.code);
                  return (
                    <Box
                      key={perm.code}
                      className="cpg-card"
                      display="flex"
                      alignItems="center"
                      gap={3}
                      p="11px 13px"
                      borderRadius="11px"
                      borderWidth="1px"
                      borderColor={isOn ? "#cfe7d9" : "#e7ebf0"}
                      bg={isOn ? "#f5fbf7" : "white"}
                      cursor={readOnly ? "default" : "pointer"}
                      onClick={readOnly ? undefined : () => onToggle(perm.code)}
                      _hover={readOnly ? {} : { borderColor: "#cdd5df" }}
                      style={{ transition: "background 0.12s, border-color 0.12s" }}
                    >
                      <VStack gap={0} align="start" flex={1} minW={0}>
                        <Text fontSize="13.5px" fontWeight="600" color="#26303d" lineHeight="1.3">
                          {perm.name}
                        </Text>
                        <Text fontSize="12px" color="#9aa3af" lineHeight="1.4">
                          {perm.description}
                        </Text>
                      </VStack>
                      <ToggleSwitch on={isOn} onToggle={() => onToggle(perm.code)} disabled={readOnly} />
                    </Box>
                  );
                })}
              </Grid>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}

// ─── MemberDetail (right pane) ────────────────────────────────────────────────

interface MemberDetailProps {
  member: MemberPermissions;
  permissions: Permission[];
  profiles: GroupPermissionProfile[];
  groupSlug: string;
  onToggle: (userId: string, code: string) => void;
  onProfileChange: (userId: string, profileId: string | null) => void;
  profileSaving: string | null;
}

function MemberDetail({ member, permissions, profiles, onToggle, onProfileChange, profileSaving }: MemberDetailProps) {
  const role = getPrimaryRole(member.roles);
  const isAdmin = role === "admin";
  const name = getMemberDisplayName(member);
  const email = getMemberEmail(member);

  return (
    <Box className="mpw-detail" flex={1} bg="white" borderWidth="1px" borderColor="#e4e8ee" borderRadius="14px" overflow="hidden">
      {/* Detail header */}
      <Flex
        className="mpw-detail-header"
        align="center"
        gap={4}
        px={6}
        py={5}
        borderBottomWidth="1px"
        borderColor="#eef1f4"
        flexWrap="wrap"
      >
        <RoleAvatar name={name} role={role} size="48px" fontSize="18px" />
        <Box flex={1} minW={0}>
          <HStack gap={2} align="center" mb={0.5}>
            <Text fontSize="20px" fontWeight="700" color="#26303d">{name}</Text>
            <RoleBadge role={role} />
          </HStack>
          <Text fontSize="13.5px" color="#8a93a0">{email}</Text>
        </Box>
        <Box flexShrink={0}>
          <Text fontSize="12px" fontWeight="600" color="#9aa3af" mb={1}>Profile</Text>
          <select
            value={member.permission_profile?.id ?? ""}
            onChange={e => onProfileChange(member.user_id, e.target.value || null)}
            disabled={profileSaving === member.user_id || isAdmin}
            style={{
              height: "38px",
              minWidth: "170px",
              borderRadius: "9px",
              border: "1px solid #dce1e8",
              background: "white",
              fontSize: "13.5px",
              padding: "0 10px",
              color: "#26303d",
            }}
          >
            <option value="">No profile</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}{p.is_default ? " (Default)" : ""}
              </option>
            ))}
          </select>
        </Box>
      </Flex>

      {/* Body */}
      {isAdmin ? (
        <Box p={6}>
          <Flex
            gap={3}
            p="16px 18px"
            bg="#fdecec"
            borderWidth="1px"
            borderColor="#f6d4d4"
            borderRadius="12px"
            align="flex-start"
          >
            <Box color="#c0392b" mt={0.5} flexShrink={0}>
              <ShieldCheck size={20} />
            </Box>
            <Box>
              <Text fontSize="14.5px" fontWeight="700" color="#26303d" mb={1}>
                Full administrative access
              </Text>
              <Text fontSize="13.5px" color="#7a8392" lineHeight="1.5">
                Admins hold every capability by default. Per-capability toggles don&apos;t apply. Remove admin to manage individual permissions.
              </Text>
            </Box>
          </Flex>
        </Box>
      ) : (
        <CapabilityGrid
          permissions={permissions}
          enabledCodes={member.decorators}
          onToggle={code => onToggle(member.user_id, code)}
        />
      )}
    </Box>
  );
}

// ─── BulkActionBar ────────────────────────────────────────────────────────────

interface BulkActionBarProps {
  count: number;
  permissions: Permission[];
  profiles: GroupPermissionProfile[];
  onApplyProfile: (profileId: string) => void;
  onGrantCapability: (code: string) => void;
  onRevokeCapability: (code: string) => void;
  onClear: () => void;
}

function BulkActionBar({ count, permissions, profiles, onApplyProfile, onGrantCapability, onRevokeCapability, onClear }: BulkActionBarProps) {
  const selectStyle: React.CSSProperties = {
    height: "36px",
    borderRadius: "9px",
    background: "#2a323e",
    border: "1px solid #39414e",
    color: "white",
    fontSize: "13.5px",
    padding: "0 10px",
  };

  return (
    <Box
      className="mpw-bulk-bar"
      bg="#1f2733"
      borderRadius="12px"
      px={4}
      py={3}
      mb={4}
    >
      <Flex align="center" gap={3} flexWrap="wrap">
        <HStack gap={2} flexShrink={0}>
          <Box
            bg="#1f8a52"
            color="white"
            fontWeight="700"
            fontSize="13px"
            px="9px"
            py="3px"
            borderRadius="7px"
          >
            {count}
          </Box>
          <Text color="white" fontSize="14px" fontWeight="600">selected</Text>
        </HStack>

        <Box w="1px" h="20px" bg="#39414e" flexShrink={0} />

        <select
          style={selectStyle}
          value=""
          onChange={e => { if (e.target.value) { onApplyProfile(e.target.value); e.target.value = ""; } }}
        >
          <option value="">Apply profile…</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select
          style={selectStyle}
          value=""
          onChange={e => { if (e.target.value) { onGrantCapability(e.target.value); e.target.value = ""; } }}
        >
          <option value="">Grant capability…</option>
          {permissions.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
        </select>

        <select
          style={selectStyle}
          value=""
          onChange={e => { if (e.target.value) { onRevokeCapability(e.target.value); e.target.value = ""; } }}
        >
          <option value="">Revoke capability…</option>
          {permissions.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
        </select>

        <Box flex={1} />

        <Button
          size="xs"
          variant="ghost"
          color="#aeb6c2"
          _hover={{ color: "white" }}
          onClick={onClear}
        >
          Clear
        </Button>
      </Flex>
    </Box>
  );
}

// ─── MemberListPane ───────────────────────────────────────────────────────────

interface MemberListPaneProps {
  members: MemberPermissions[];
  permissions: Permission[];
  activeMemberId: string | null;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onCheckToggle: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
}

function MemberListPane({ members, permissions, activeMemberId, selectedIds, onSelect, onCheckToggle, onSelectAll }: MemberListPaneProps) {
  const allChecked = members.length > 0 && members.every(m => selectedIds.has(m.user_id));
  const someChecked = members.some(m => selectedIds.has(m.user_id)) && !allChecked;

  return (
    <Box
      className="mpw-member-list"
      w="340px"
      flexShrink={0}
      bg="white"
      borderWidth="1px"
      borderColor="#e4e8ee"
      borderRadius="14px"
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        align="center"
        gap={3}
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor="#eef1f4"
      >
        <Checkbox.Root
          checked={someChecked ? "indeterminate" : allChecked}
          onCheckedChange={e => onSelectAll(!!e.checked)}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control
            borderColor="#9aa3af"
            _checked={{ bg: "#1f8a52", borderColor: "#1f8a52" }}
          >
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Root>
        <Text fontSize="12px" fontWeight="700" letterSpacing="0.06em" color="#9aa3af" textTransform="uppercase">
          Members
        </Text>
      </Flex>

      {/* Scrollable list */}
      <Box overflowY="auto" maxH="620px">
        {members.map(member => {
          const role = getPrimaryRole(member.roles);
          const name = getMemberDisplayName(member);
          const isActive = activeMemberId === member.user_id;
          const isChecked = selectedIds.has(member.user_id);
          const isAdmin = role === "admin";
          const grantedCount = isAdmin ? permissions.length : member.decorators.length;

          return (
            <Box
              key={member.user_id}
              className="mpw-member-row"
              display="flex"
              alignItems="center"
              gap={3}
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor="#f4f6f8"
              cursor="pointer"
              bg={isActive ? "#f5fbf7" : "white"}
              borderLeftWidth="3px"
              borderLeftColor={isActive ? "#1f8a52" : "transparent"}
              _hover={{ bg: isActive ? "#f5fbf7" : "#f7f9fb" }}
              onClick={() => onSelect(member.user_id)}
            >
              <Box onClick={e => { e.stopPropagation(); onCheckToggle(member.user_id); }} flexShrink={0}>
                <Checkbox.Root
                  checked={isChecked}
                  onCheckedChange={() => onCheckToggle(member.user_id)}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control
                    borderColor="#9aa3af"
                    _checked={{ bg: "#1f8a52", borderColor: "#1f8a52" }}
                  >
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox.Root>
              </Box>

              <RoleAvatar name={name} role={role} />

              <Box flex={1} minW={0}>
                <HStack gap={2} align="center" mb={0.5}>
                  <Text
                    fontSize="14.5px"
                    fontWeight="600"
                    color="#26303d"
                    overflow="hidden"
                    whiteSpace="nowrap"
                    textOverflow="ellipsis"
                  >
                    {name.length > 12 ? name.slice(0, 12) + "…" : name}
                  </Text>
                  <RoleBadge role={role} />
                </HStack>
                <Text fontSize="12.5px" color="#9aa3af">
                  {isAdmin ? "All capabilities" : `${grantedCount} of ${permissions.length} capabilities`}
                </Text>
              </Box>

              <Box color="#c2c9d3" flexShrink={0}>
                <ChevronRight size={14} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── ProfilesTab ──────────────────────────────────────────────────────────────

interface ProfilesTabProps {
  profiles: GroupPermissionProfile[];
  permissions: Permission[];
  groupSlug: string;
}

function ProfilesTab({ profiles, permissions, groupSlug }: ProfilesTabProps) {
  const sortedProfiles = useMemo(() => [...profiles].sort((a, b) => a.sort_order - b.sort_order), [profiles]);

  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftDecorators, setDraftDecorators] = useState<string[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  const createMutation = useCreatePermissionProfile(groupSlug);
  const updateMutation = useUpdatePermissionProfile(groupSlug);
  const cloneMutation = useClonePermissionProfile(groupSlug);

  const activeProfile = sortedProfiles.find(p => p.id === activeProfileId) ?? null;

  useEffect(() => {
    if (!activeProfileId && sortedProfiles.length > 0) {
      setActiveProfileId(sortedProfiles[0].id);
    }
  }, [sortedProfiles, activeProfileId]);

  useEffect(() => {
    if (!activeProfile) return;
    setDraftName(activeProfile.name);
    setDraftDescription(activeProfile.description || "");
    setDraftDecorators(activeProfile.decorators);
  }, [activeProfile]);

  const toggleDraftDecorator = (code: string) => {
    setDraftDecorators(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const handleSave = async () => {
    if (!activeProfile) return;
    await updateMutation.mutateAsync({
      profileId: activeProfile.id,
      payload: { name: draftName.trim(), description: draftDescription.trim(), decorators: draftDecorators },
    });
  };

  const handleClone = async () => {
    if (!activeProfile) return;
    const cloned = await cloneMutation.mutateAsync({ profileId: activeProfile.id });
    setActiveProfileId(cloned.id);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const created = await createMutation.mutateAsync({ name, description: "", decorators: [] });
    setNewName("");
    setShowNew(false);
    setActiveProfileId(created.id);
  };

  const nonDefaultCount = sortedProfiles.filter(p => !p.is_default).length;
  void nonDefaultCount;

  return (
    <Box className="mpw-profiles-tab">
      {/* Notice */}
      <Flex
        gap={3}
        p="15px 18px"
        bg="#f3f6f4"
        borderWidth="1px"
        borderColor="#e1ebe4"
        borderRadius="12px"
        mb={5}
        align="flex-start"
      >
        <Box color="#1f8a52" mt={0.5} flexShrink={0}>
          <Info size={16} />
        </Box>
        <Text fontSize="13.5px" color="#5d6a5f" lineHeight="1.5">
          <Text as="span" fontWeight="700">Profiles aren&apos;t in use yet.</Text>
          {" "}Define reusable capability sets here, then assign them to members from the Members tab. Editing a profile re-syncs everyone assigned to it.
        </Text>
      </Flex>

      <Flex gap={6} align="flex-start" flexWrap="wrap">
        {/* Left: profiles list */}
        <Box w="260px" flexShrink={0}>
          <Flex align="center" justify="space-between" mb={3}>
            <Text fontSize="11.5px" fontWeight="700" letterSpacing="0.07em" color="#9aa3af" textTransform="uppercase">
              Profiles
            </Text>
            <Button
              size="xs"
              variant="ghost"
              color="#1f8a52"
              onClick={() => setShowNew(v => !v)}
            >
              + New
            </Button>
          </Flex>

          {showNew && (
            <Flex gap={2} mb={3}>
              <Input
                size="sm"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Profile name"
                borderRadius="9px"
                flex={1}
              />
              <Button
                size="sm"
                colorPalette="green"
                loading={createMutation.isPending}
                disabled={!newName.trim()}
                onClick={handleCreate}
              >
                Add
              </Button>
            </Flex>
          )}

          <VStack gap={2} align="stretch">
            {sortedProfiles.map(p => (
              <Box
                key={p.id}
                p="12px 14px"
                borderRadius="10px"
                borderWidth="1px"
                borderColor={activeProfileId === p.id ? "#1f8a52" : "#e4e8ee"}
                bg={activeProfileId === p.id ? "#f5fbf7" : "white"}
                cursor="pointer"
                onClick={() => setActiveProfileId(p.id)}
              >
                <Flex align="center" justify="space-between" mb={0.5}>
                  <Text fontSize="14.5px" fontWeight="600" color="#26303d">{p.name}</Text>
                  {p.is_default && (
                    <Box
                      fontSize="11px"
                      fontWeight="600"
                      color="#1f8a52"
                      bg="#e3f3ea"
                      px="6px"
                      py="2px"
                      borderRadius="full"
                    >
                      Default
                    </Box>
                  )}
                </Flex>
                <Text fontSize="12.5px" color="#8a93a0">
                  {/* member count not in profile type; omit */}
                  {p.decorators.length} capabilities
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Right: profile editor */}
        {activeProfile ? (
          <Box flex={1} minW={0}>
            <Flex align="center" justify="space-between" mb={2} flexWrap="wrap" gap={3}>
              <Heading size="md" fontWeight="700" color="#26303d">{activeProfile.name}</Heading>
              <HStack gap={2}>
                <Button size="sm" variant="outline" loading={cloneMutation.isPending} onClick={handleClone}>
                  Clone
                </Button>
                <Button
                  size="sm"
                  bg="#1f8a52"
                  color="white"
                  _hover={{ bg: "#187a47" }}
                  loading={updateMutation.isPending}
                  disabled={!draftName.trim()}
                  onClick={handleSave}
                >
                  Save profile
                </Button>
              </HStack>
            </Flex>

            <Text fontSize="13.5px" color="#8a93a0" mb={4}>
              {activeProfile.description || "No description."}
            </Text>

            <CapabilityGrid
              permissions={permissions}
              enabledCodes={draftDecorators}
              onToggle={toggleDraftDecorator}
            />
          </Box>
        ) : (
          <Box flex={1}>
            <Text color="#9aa3af" fontSize="sm">
              {sortedProfiles.length === 0 ? "Create a profile to get started." : "Select a profile to edit."}
            </Text>
          </Box>
        )}
      </Flex>
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GroupPermissionsWorkArea({
  groupSlug,
  groupTitle,
  circleMode = false,
}: GroupPermissionsWorkAreaProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("members");
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const borderColor = useColorModeValue("#e4e8ee", "gray.700");

  // Data
  const { data: membersRaw, isLoading: membersLoading } = useMemberPermissions(groupSlug);
  const { data: availablePermsRaw } = useAvailablePermissions(groupSlug);
  const { data: profiles = [], isLoading: profilesLoading } = usePermissionProfiles(groupSlug);

  // Mutations
  const grantMutation = useGrantPermission(groupSlug);
  const revokeMutation = useRevokePermission(groupSlug);
  const assignProfileMutation = useAssignPermissionProfile(groupSlug);

  const [profileSaving, setProfileSaving] = useState<string | null>(null);

  // Resolve permissions list
  const allPermissions = useMemo(() => {
    const base = availablePermsRaw ?? FALLBACK_PERMISSIONS;
    return base.filter(p => !circleMode || CIRCLE_PERMISSION_CODES.has(p.code));
  }, [availablePermsRaw, circleMode]);

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!membersRaw) return [];
    const q = searchQuery.toLowerCase();
    if (!q) return membersRaw;
    return membersRaw.filter(m => {
      const name = getMemberDisplayName(m).toLowerCase();
      const email = getMemberEmail(m).toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [membersRaw, searchQuery]);

  // Set first member as active on load
  useEffect(() => {
    if (!activeMemberId && filteredMembers.length > 0) {
      setActiveMemberId(filteredMembers[0].user_id);
    }
  }, [filteredMembers, activeMemberId]);

  const activeMember = membersRaw?.find(m => m.user_id === activeMemberId) ?? null;
  const sortedProfiles = useMemo(() => [...profiles].sort((a, b) => a.sort_order - b.sort_order), [profiles]);

  // Toggle a single capability for a member
  const togglePermission = async (userId: string, code: string) => {
    const member = membersRaw?.find(m => m.user_id === userId);
    if (!member) return;
    if (member.roles.includes("admin")) return;
    const hasIt = member.decorators.includes(code);
    try {
      if (hasIt) {
        await revokeMutation.mutateAsync({ userId, decorator: code });
      } else {
        await grantMutation.mutateAsync({ userId, decorator: code });
      }
    } catch {
      // Mutation hook handles error toast
    }
  };

  // Assign profile to a member
  const handleProfileChange = async (userId: string, profileId: string | null) => {
    setProfileSaving(userId);
    try {
      await assignProfileMutation.mutateAsync({ userId, profileId });
    } catch {
      toaster.create({ title: "Failed to assign profile", type: "error" });
    } finally {
      setProfileSaving(null);
    }
  };

  // Bulk actions
  const bulkTargets = useMemo(() => {
    return filteredMembers.filter(m => selectedIds.has(m.user_id) && !m.roles.includes("admin"));
  }, [filteredMembers, selectedIds]);

  const handleBulkApplyProfile = async (profileId: string) => {
    for (const m of bulkTargets) {
      await assignProfileMutation.mutateAsync({ userId: m.user_id, profileId });
    }
    setSelectedIds(new Set());
  };

  const handleBulkGrant = async (code: string) => {
    for (const m of bulkTargets) {
      if (!m.decorators.includes(code)) {
        await grantMutation.mutateAsync({ userId: m.user_id, decorator: code });
      }
    }
    setSelectedIds(new Set());
  };

  const handleBulkRevoke = async (code: string) => {
    for (const m of bulkTargets) {
      if (m.decorators.includes(code)) {
        await revokeMutation.mutateAsync({ userId: m.user_id, decorator: code });
      }
    }
    setSelectedIds(new Set());
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredMembers.map(m => m.user_id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleCheckToggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loading = membersLoading || profilesLoading;

  const memberCount = membersRaw?.length ?? 0;
  const profileCount = sortedProfiles.length;

  return (
    <Box
      className="mpw-root"
      maxW="1180px"
      mx="auto"
      px={6}
      pt={7}
      pb={16}
      bg="#eceef2"
      minH="100vh"
    >
      {/* Page header */}
      <Box mb={5}>
        <Heading
          size="xl"
          fontWeight="700"
          color="#26303d"
          letterSpacing="-0.01em"
          mb={1}
        >
          Member Permissions
        </Heading>
        <Text fontSize="15px" color="#6b7685">
          Grant capabilities to members of{" "}
          <Text as="span" fontWeight="600" color="#4a5563">{groupTitle ?? groupSlug}</Text>.
        </Text>
      </Box>

      {/* Tabs */}
      <Box
        className="mpw-tabs"
        borderBottomWidth="1px"
        borderColor={borderColor}
        mb={5}
      >
        <HStack gap={0}>
          {(["members", "profiles"] as ActiveTab[]).map(tab => {
            const isActive = activeTab === tab;
            const count = tab === "members" ? memberCount : profileCount;
            return (
              <Box
                key={tab}
                as="button"
                px="14px"
                py="11px"
                fontSize="15px"
                fontWeight={isActive ? "700" : "600"}
                color={isActive ? "#26303d" : "#8a93a0"}
                borderBottomWidth="2px"
                borderBottomColor={isActive ? "#1f8a52" : "transparent"}
                mb="-1px"
                cursor="pointer"
                onClick={() => setActiveTab(tab)}
                _hover={{ color: "#26303d" }}
                textTransform="capitalize"
              >
                {tab}{" "}
                <Box
                  as="span"
                  display="inline-flex"
                  alignItems="center"
                  px="6px"
                  py="1px"
                  borderRadius="full"
                  fontSize="12px"
                  fontWeight="600"
                  bg={isActive ? "#e3f3ea" : "#eef1f4"}
                  color={isActive ? "#1f8a52" : "#9aa3af"}
                  ml={1}
                >
                  {count}
                </Box>
              </Box>
            );
          })}
        </HStack>
      </Box>

      {/* Tab content */}
      {loading ? (
        <Box py={16} textAlign="center">
          <Spinner size="lg" />
        </Box>
      ) : activeTab === "members" ? (
        <Box className="mpw-members-tab">
          {/* Toolbar */}
          <Flex align="center" justify="space-between" mb={selectedIds.size > 0 ? 3 : 4} gap={4}>
            <Box position="relative" flex={1} maxW="340px">
              <Input
                placeholder="Search members"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                h="42px"
                bg="white"
                borderColor="#dce1e8"
                borderRadius="10px"
                pl={9}
                fontSize="14px"
                _focus={{ borderColor: "#1f8a52", boxShadow: "0 0 0 3px rgba(31,138,82,0.12)" }}
              />
              <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="#9aa3af" pointerEvents="none">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </Box>
            </Box>
            <Text fontSize="13.5px" color="#8a93a0" fontWeight="500" flexShrink={0}>
              {filteredMembers.length} of {memberCount} members
            </Text>
          </Flex>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <BulkActionBar
              count={selectedIds.size}
              permissions={allPermissions}
              profiles={sortedProfiles}
              onApplyProfile={handleBulkApplyProfile}
              onGrantCapability={handleBulkGrant}
              onRevokeCapability={handleBulkRevoke}
              onClear={() => setSelectedIds(new Set())}
            />
          )}

          {/* Two panes */}
          <Flex gap="18px" align="flex-start">
            <MemberListPane
              members={filteredMembers}
              permissions={allPermissions}
              activeMemberId={activeMemberId}
              selectedIds={selectedIds}
              onSelect={id => setActiveMemberId(id)}
              onCheckToggle={handleCheckToggle}
              onSelectAll={handleSelectAll}
            />

            {activeMember ? (
              <MemberDetail
                member={activeMember}
                permissions={allPermissions}
                profiles={sortedProfiles}
                groupSlug={groupSlug}
                onToggle={togglePermission}
                onProfileChange={handleProfileChange}
                profileSaving={profileSaving}
              />
            ) : (
              <Flex flex={1} align="center" justify="center" minH="300px">
                <Text color="#9aa3af" fontSize="sm">Select a member to view their permissions.</Text>
              </Flex>
            )}
          </Flex>
        </Box>
      ) : (
        <ProfilesTab
          profiles={sortedProfiles}
          permissions={allPermissions}
          groupSlug={groupSlug}
        />
      )}
    </Box>
  );
}

// src/components/groups/forms/GroupInviteForm.tsx

"use client";

import {
  Box,
  Button,
  Input,
  Text,
  Textarea,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import { useState, useCallback, useRef, useEffect } from "react";
import { IconUsers, IconX } from "@tabler/icons-react";
import { Checkbox } from "@chakra-ui/react";
import { UserProfile } from "@mixtape/core/types/auth";
import { GroupMembership } from "@mixtape/core/types/groupTypes";

interface InviteFormProps {
  groupSlug: string;
  onSuccess?: (invitationId: number, inviteContext?: { type: string, target: string }) => void;
  groupMembers?: GroupMembership[];
  allSiteMembers?: UserProfile[];
  siteMembersLoading?: boolean;
  parentGroupName?: string;
}

interface UserSuggestion {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

const UserSuggestions = ({
  suggestions,
  onSelect,
  isVisible,
  selectedIndex = 0,
}: {
  suggestions: UserSuggestion[];
  onSelect: (user: UserSuggestion) => void;
  isVisible: boolean;
  selectedIndex?: number;
}) => {
  const selectedRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }


  return (
    <Box
      position="absolute"
      top="100%"
      left={0}
      right={0}
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      boxShadow="lg"
      zIndex={20}
      maxH="200px"
      overflowY="auto"
    >
      {suggestions.map((user, index) => (
        <Box
          key={user.id}
          ref={index === selectedIndex ? selectedRef : null}
          p={3}
          data-testid="user-suggestion-item"
          cursor="pointer"
          bg={index === selectedIndex ? "green.50" : "white"}
          borderLeft={index === selectedIndex ? "3px solid" : "none"}
          borderLeftColor="green.500"
          _hover={{ bg: "gray.50" }}
          onClick={() => onSelect(user)}
          borderBottom="1px solid"
          borderColor="gray.100"
          _last={{ borderBottom: "none" }}
        >
          <Text fontWeight="medium">@{user.username}</Text>
          <Text fontSize="sm" color="gray.600">
            {user.first_name} {user.last_name} · {user.email}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

interface MemberSelectorProps {
  members: GroupMembership[];
  onAdd: (usernames: string[]) => void;
  onClose: () => void;
  parentGroupName?: string;
}

const MemberSelector = ({ members, onAdd, onClose, parentGroupName }: MemberSelectorProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = members.filter(m => {
    const query = searchQuery.toLowerCase();
    const username = m.username?.toLowerCase() || '';
    const firstName = m.first_name?.toLowerCase() || '';
    const lastName = m.last_name?.toLowerCase() || '';
    const email = m.email?.toLowerCase() || '';
    return (
      username.includes(query) ||
      firstName.includes(query) ||
      lastName.includes(query) ||
      email.includes(query)
    );
  });

  const toggleMember = (username: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(username)) {
      newSelected.delete(username);
    } else {
      newSelected.add(username);
    }
    setSelected(newSelected);
  };

  const toggleAll = () => {
    if (selected.size === filteredMembers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredMembers.map(m => m.username || '')));
    }
  };

  const handleAdd = () => {
    onAdd(Array.from(selected));
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        inset={0}
        bg="blackAlpha.600"
        zIndex={999}
        onClick={onClose}
      />

      {/* Modal */}
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        bg="white"
        borderRadius="lg"
        boxShadow="xl"
        zIndex={1000}
        w="90%"
        maxW="500px"
        maxH="80vh"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <HStack justify="space-between" p={4} borderBottom="1px solid" borderColor="gray.200">
          <Text fontWeight="bold" fontSize="lg">
            {parentGroupName ? `Select from ${parentGroupName}` : 'Select Group Members'}
          </Text>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <IconX size={18} />
          </Button>
        </HStack>

        {/* Search */}
        <Box p={4} borderBottom="1px solid" borderColor="gray.200">
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="sm"
          />
          <HStack mt={2} justify="space-between">
            <Text fontSize="sm" color="gray.600">
              {selected.size} selected
            </Text>
            <Button variant="ghost" size="xs" onClick={toggleAll}>
              {selected.size === filteredMembers.length ? "Clear All" : "Select All"}
            </Button>
          </HStack>
        </Box>

        {/* Member List */}
        <Box flex="1" overflowY="auto" p={4}>
          <VStack align="stretch" gap={2}>
            {filteredMembers.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={4}>
                No members found
              </Text>
            ) : (
              filteredMembers.map((member) => (
                <Checkbox.Root
                  key={member.member_id}
                  checked={selected.has(member.username || '')}
                  onCheckedChange={() => toggleMember(member.username || '')}
                  p={2}
                  borderRadius="md"
                  _hover={{ bg: "gray.50" }}
                  cursor="pointer"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label flex="1" cursor="pointer">
                    <VStack align="start" gap={0}>
                      <Text fontWeight="medium" fontSize="sm">
                        @{member.username}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {member.first_name} {member.last_name}
                      </Text>
                    </VStack>
                  </Checkbox.Label>
                </Checkbox.Root>
              ))
            )}
          </VStack>
        </Box>

        {/* Footer */}
        <HStack p={4} borderTop="1px solid" borderColor="gray.200" justify="flex-end" gap={2}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="green"
            size="sm"
            onClick={handleAdd}
            disabled={selected.size === 0}
          >
            Add {selected.size > 0 && `(${selected.size})`}
          </Button>
        </HStack>
      </Box>
    </>
  );
};

export const GroupInviteForm = ({
  groupSlug,
  onSuccess,
  groupMembers = [],
  allSiteMembers = [],
  siteMembersLoading = false,
  parentGroupName,
}: InviteFormProps) => {
  void siteMembersLoading;
  const { handleSubmit, reset, control, setValue, watch } = useForm({
    defaultValues: {
      invitee: "",
      message: "",
    }
  });

  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const inviteeValue = watch("invitee");

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [userSuggestions]);

  // Email validation regex
  const isEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  // Typeahead for @username - searches all site members
  useEffect(() => {
    const searchTerm = inviteeValue?.toLowerCase() || "";

    if (isEmail(searchTerm)) {
      setUserSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Look for @ at the end of the current input (after last comma)
    const entries = searchTerm.split(',');
    const lastEntry = entries[entries.length - 1].trim();

    if (lastEntry.startsWith('@') && lastEntry.length > 1) {
      const cleanSearchTerm = lastEntry.slice(1);

      // Use allSiteMembers for typeahead (broader community)
      const availableMembers = allSiteMembers.length > 0 ? allSiteMembers : groupMembers;

      const filtered = availableMembers
        .filter((member) => {
          // Safely access properties that may not exist on all member types
          const username = ('username' in member ? member.username : undefined)?.toLowerCase() || '';
          const firstName = ('first_name' in member ? member.first_name : undefined)?.toLowerCase() || '';
          const lastName = ('last_name' in member ? member.last_name : undefined)?.toLowerCase() || '';
          const fullName = `${firstName} ${lastName}`.trim();

          return username.includes(cleanSearchTerm) || fullName.includes(cleanSearchTerm);
        })
        .slice(0, 8)
        .map((member): UserSuggestion => {
          // GroupMembership has member_id, UserProfile has id
          const memberId = 'member_id' in member ? member.member_id : member.id;

          // Safely access properties that may not exist on UserProfile
          const username = 'username' in member ? member.username : undefined;
          const firstName = 'first_name' in member ? member.first_name : undefined;
          const lastName = 'last_name' in member ? member.last_name : undefined;
          const email = 'email' in member ? member.email : undefined;

          return {
            id: parseInt(String(memberId)) || 0,
            username: username || 'unknown',
            first_name: firstName,
            last_name: lastName,
            email: email || ''
          };
        })

      setUserSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setUserSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inviteeValue, allSiteMembers, groupMembers]);

  const handleUserSelect = useCallback((user: UserSuggestion) => {
    const currentValue = inviteeValue?.trim() || '';
    const entries = currentValue.split(',').map(s => s.trim());
    entries[entries.length - 1] = `@${user.username}`;
    setValue("invitee", entries.join(', ') + ', ');
    setShowSuggestions(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [inviteeValue, setValue]);

  const handleInputBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 150);
  }, []);

  const handleInputFocus = useCallback(() => {
    const entries = (inviteeValue || '').split(',');
    const lastEntry = entries[entries.length - 1].trim();
    if (lastEntry.startsWith('@') && lastEntry.length > 1 && userSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [inviteeValue, userSuggestions.length]);

  const handleAddMembers = useCallback((usernames: string[]) => {
    const currentValue = inviteeValue?.trim() || '';
    const existingEntries = currentValue
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const newEntries = usernames.map(u => `@${u}`);
    const allEntries = [...existingEntries, ...newEntries];
    const uniqueEntries = Array.from(new Set(allEntries));

    setValue("invitee", uniqueEntries.join(', '));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [inviteeValue, setValue]);

  // Update the handleKeyDown callback to include handleUserSelect in dependencies
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || userSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < userSuggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;

      case 'Enter':
        if (showSuggestions) {
          e.preventDefault();
          handleUserSelect(userSuggestions[selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  }, [showSuggestions, userSuggestions, selectedIndex, handleUserSelect]); // ← Add handleUserSelect here

  const onSubmit = async (data: { invitee: string; message?: string }) => {
    const inviteeValue = data.invitee.trim();

    if (!inviteeValue) {
      toaster.create({
        title: "Validation Error",
        description: "Please enter at least one email address or username.",
        type: "error",
        duration: 5000,
      });
      return;
    }

    try {
      const submitData = {
        message: data.message,
        invite_scope: "site_and_public",
        invited_emails: [] as string[],
        invited_usernames: [] as string[],
      };

      const invitees = data.invitee
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      const invalidEntries: string[] = [];

      for (const invitee of invitees) {
        if (isEmail(invitee)) {
          submitData.invited_emails.push(invitee);
        } else if (invitee.startsWith('@')) {
          const username = invitee.slice(1);

          if (!username) {
            invalidEntries.push(invitee);
          } else if (username.includes('@') || username.includes('.com') || username.includes('.')) {
            invalidEntries.push(invitee);
          } else {
            submitData.invited_usernames.push(username);
          }
        } else {
          invalidEntries.push(invitee);
        }
      }

      if (invalidEntries.length > 0) {
        toaster.create({
          title: "Invalid Entries",
          description: `Could not process: ${invalidEntries.join(', ')}. Use email@example.com or @username format.`,
          type: "error",
          duration: 7000,
        });
        return;
      }

      if (submitData.invited_emails.length === 0 && submitData.invited_usernames.length === 0) {
        toaster.create({
          title: "Validation Error",
          description: "Please enter at least one valid email address or username.",
          type: "error",
          duration: 5000,
        });
        return;
      }

      const res = await axiosInstance.post(`/api/groups/${groupSlug}/invite`, submitData);

      void res.data.invitations_created;
      const totalInvites = submitData.invited_emails.length + submitData.invited_usernames.length;

      reset();

      const firstInvitationId = res.data.invitations?.[0]?.id || res.data.id;
      if (firstInvitationId && onSuccess) {
        onSuccess(firstInvitationId, {
          type: 'batch',
          target: `${totalInvites} recipients`
        });
      }

    } catch (error) {
      console.error("Error sending invite:", error);

      const response = (error as { response?: { status?: number; data?: { invitations_created?: number; errors?: unknown[]; detail?: string } } }).response;

      if (response?.status === 207) {
        const created = response.data?.invitations_created || 0;
        const errors = response.data?.errors?.length || 0;

        toaster.create({
          title: "Partial Success",
          description: `Sent ${created} invitation${created !== 1 ? 's' : ''}, ${errors} failed.`,
          type: "warning",
          duration: 7000,
        });
      } else {
        toaster.create({
          title: "Invite Failed",
          description: response?.data?.detail || "Could not send invites.",
          type: "error",
          duration: 5000,
        });
      }
    }
  };

  return (
    <Box data-testid="invitations-section" as="form" onSubmit={handleSubmit(onSubmit)} mt={6}>
      <VStack gap={4} align="stretch">

        {/* Main Input with Member Selector Button */}
        <Box border="1px solid" borderColor="gray.300" borderRadius="md" p={4}>
          <Text fontWeight="semibold" mb={2}>
            Invite People
          </Text>

          <HStack gap={2} mb={2}>
            <Box position="relative" flex="1">
              <Controller
                name="invitee"
                control={control}
                rules={{ required: "Email or username is required" }}
                render={({ field }) => (
                  <Input
                    data-testid="invite-input"
                    {...field}
                    ref={inputRef}
                    bg="white"
                    placeholder="user@example.com, @username, ..."
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                  />
                )}
              />
              <UserSuggestions
                suggestions={userSuggestions}
                onSelect={handleUserSelect}
                isVisible={showSuggestions}
                selectedIndex={selectedIndex}
              />
            </Box>

            <Button
              variant="outline"
              size="md"
              onClick={() => setShowMemberSelector(true)}
            >
              <IconUsers size={18} />
            </Button>
          </HStack>

          <Text fontSize="sm" color="gray.600">
            {parentGroupName
              ? `Select members from ${parentGroupName} using the button above, or enter @usernames.`
              : "Enter emails, or @usernames for existing members. Separate multiple entries with commas."
            }
          </Text>
        </Box>

        {/* Message */}
        <Box border="1px solid" borderColor="gray.300" borderRadius="md" p={4}>
          <Text fontWeight="semibold" mb={2}>
            Personal Message <Text as="span" fontWeight="normal" color="gray.500">(optional)</Text>
          </Text>
          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                bg="white"
                placeholder="Add a personal message to your invitation..."
                rows={3}
                autoComplete="off"
              />
            )}
          />
        </Box>

        <Button data-testid="send-invite-button" type="submit" size="lg" colorScheme="green">
          Send Invitation{inviteeValue?.includes(',') ? 's' : ''}
        </Button>
      </VStack>

      {/* Member Selector Modal */}
      {showMemberSelector && (
        <MemberSelector
          members={groupMembers}
          onAdd={handleAddMembers}
          onClose={() => setShowMemberSelector(false)}
          parentGroupName={parentGroupName}
        />
      )}
    </Box>
  );
};

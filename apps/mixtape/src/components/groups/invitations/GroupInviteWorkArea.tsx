// apps/mixtape/src/components/groups/GroupInviteWorkArea.tsx

"use client";

import {
  Box,
  Heading,
  Text,
  HStack,
} from "@chakra-ui/react";
import { Tabs } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { IconSend, IconList } from "@tabler/icons-react";
import GroupInvitations from "./GroupInvitations";
import { GroupMembership } from "@mixtape/core/types/groupTypes";
import { UserProfile } from "@mixtape/core/types/auth";
import { GroupInviteForm } from "../forms/GroupInviteForm";
import { useInvitationStatusPoll } from "@mixtape/api/hooks/groups/useInvitationStatusPoll";

interface GroupInviteWorkAreaProps {
  groupSlug: string;
  onMembersRefetch?: () => void;
  groupMembers: GroupMembership[];
  allSiteMembers?: UserProfile[];
  siteMembersLoading: boolean;
  parentGroupName?: string;
}

export default function GroupInviteWorkArea({
  groupSlug,
  onMembersRefetch,
  groupMembers,
  allSiteMembers,
  siteMembersLoading,
  parentGroupName,
}: GroupInviteWorkAreaProps) {
  const [pollInvitationId, setPollInvitationId] = useState<number | null>(null);
  const [inviteStatusMessage, setInviteStatusMessage] = useState<string | null>(null);
  const [inviteStatusType, setInviteStatusType] = useState<"info" | "success" | "error" | null>(null);
  const [refreshInvitations, setRefreshInvitations] = useState(0);

  // Poll invitation status
  useInvitationStatusPoll({
    groupId: groupSlug,
    invitationId: pollInvitationId,
    onSuccess: () => {
      setInviteStatusMessage("✅ Invitation email sent successfully.");
      setInviteStatusType("success");
      setPollInvitationId(null);
      setRefreshInvitations(prev => prev + 1);
    },
    onFailure: () => {
      setInviteStatusMessage("❌ Failed to send invitation email.");
      setInviteStatusType("error");
      setPollInvitationId(null);
    },
    onPending: () => {
      setInviteStatusMessage("ℹ️ Invitation email is still being sent. It might take a moment.");
      setInviteStatusType("info");
      // setPollInvitationId(null);
    },
    maxAttempts: 23,
    delay: 5000,
  });

  // Auto-hide success messages
  useEffect(() => {
    if (inviteStatusType === "success") {
      const timer = setTimeout(() => {
        setInviteStatusMessage(null);
        setInviteStatusType(null);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [inviteStatusType]);

  const handleInviteSuccess = (invitationId: number, inviteData?: { type: string, target: string }) => {
    if (inviteData?.type === "username") {
      setInviteStatusMessage(`✅ Invitation sent to @${inviteData.target}`);
      setInviteStatusType("success");

      setTimeout(() => {
        setInviteStatusMessage(null);
        setInviteStatusType(null);
      }, 3000);
    } else {
      setInviteStatusMessage("⏳ Sending invitation email...");
      setInviteStatusType("info");
      setPollInvitationId(invitationId);
    }

    onMembersRefetch?.();
    setRefreshInvitations(prev => prev + 1);
  };

  return (
    <Box>
      <Heading size="md" mb={4}>
        Group Invitations
      </Heading>

      <Tabs.Root defaultValue="send" variant="enclosed">
        <Tabs.List mb={4}>
          <Tabs.Trigger value="send">
            <HStack>
              <IconSend size={16} />
              <Text>Send Invites</Text>
            </HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="list">
            <HStack>
              <IconList size={16} />
              <Text>Invitation History</Text>
            </HStack>
          </Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>

        {/* Send Invites Tab */}
        <Tabs.Content value="send">
          <Text mb={4} color="gray.600">
            {parentGroupName
              ? `Invite members from ${parentGroupName} to join this circle.`
              : "Send an invitation to join this group. They'll receive an email with instructions to accept the invitation."
            }
          </Text>

          <GroupInviteForm
            groupSlug={groupSlug}
            onSuccess={handleInviteSuccess}
            groupMembers={groupMembers}
            allSiteMembers={allSiteMembers}
            siteMembersLoading={siteMembersLoading}
            parentGroupName={parentGroupName}
            statusNode={inviteStatusMessage ? (
              <Text
                fontSize="sm"
                fontWeight="medium"
                px={3}
                py={2}
                borderRadius="md"
                bg={
                  inviteStatusType === "error" ? "red.50"
                  : inviteStatusType === "success" ? "green.50"
                  : "blue.50"
                }
                color={
                  inviteStatusType === "error" ? "red.600"
                  : inviteStatusType === "success" ? "green.600"
                  : "blue.600"
                }
                border="1px solid"
                borderColor={
                  inviteStatusType === "error" ? "red.200"
                  : inviteStatusType === "success" ? "green.200"
                  : "blue.200"
                }
              >
                {inviteStatusMessage}
              </Text>
            ) : undefined}
          />
        </Tabs.Content>

        {/* Invitation History Tab */}
        <Tabs.Content value="list">
          <GroupInvitations slug={groupSlug} key={refreshInvitations} />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
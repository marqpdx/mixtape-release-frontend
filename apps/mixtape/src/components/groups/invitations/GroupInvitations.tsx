// src/components/groups/GroupInvitations.tsx

"use client";

import {
  Box,
  Heading,
  Table,
  Text,
  HStack,
  Spinner,
  Icon,
  IconButton,
} from "@chakra-ui/react";
import { useEffect, useState, useCallback } from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import { Tooltip } from "@components/ui/tooltip";
import { GroupInvitation, invitationStatusIconMap } from "@mixtape/core/types/groupTypes";
import { IconCopy, IconTrash } from "@tabler/icons-react";

// import { GroupInvitation, invitationStatusIconMap } from "./interfaces";

export interface GroupInvitationsProps {
  slug: string;
}

export default function GroupInvitations({
  slug,
}: GroupInvitationsProps) {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/api/groups/${slug}/invitations`
      );
      setInvitations(res.data.results || res.data);
    } catch (error) {
      console.error(error);
      toaster.create({
        title: "Error",
        description: "Failed to load invitations.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleDeleteInvite = async (inviteId: number) => {
    if (!window.confirm("Delete this invitation?")) return;
    setDeletingId(inviteId);
    try {
      await axiosInstance.delete(`/api/groups/${slug}/invitations/${inviteId}`);
      toaster.create({
        title: "Invitation deleted",
        type: "success",
        duration: 3000,
      });
      await fetchInvitations();
    } catch {
      toaster.create({
        title: "Error",
        description: "Failed to delete invitation.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toaster.create({
        title: "Link copied",
        description: "Invite link copied to clipboard",
        type: "success",
        duration: 2500,
      });
    }).catch(() => {
      toaster.create({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        type: "error",
        duration: 3000,
      });
    });
  };

  return (
    <Box>
      <Heading size="md" mb={4}>
        Group Invitations
      </Heading>

      {loading ? (
        <HStack justify="center" py={8}>
          <Spinner size="lg" />
        </HStack>
      ) : invitations.length === 0 ? (
        <Text color="gray.500">
          No invitations have been sent for this group yet.
        </Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Email / User</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Invited By</Table.ColumnHeader>
                <Table.ColumnHeader>Created At</Table.ColumnHeader>
                <Table.ColumnHeader>Link</Table.ColumnHeader>
                <Table.ColumnHeader></Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {invitations.map((invite) => {
                const iconInfo = invitationStatusIconMap[invite.invitation_status];

                return (
                  <Table.Row key={invite.id}>
                    <Table.Cell>{invite.invited_email || "—"}</Table.Cell>

                    <Table.Cell>
                      {iconInfo ? (
                        <Tooltip
                          content={iconInfo.label}
                          positioning={{ placement: "top" }}
                          showArrow
                        >
                          <Box display="inline-flex" alignItems="center">
                            <Icon
                              as={iconInfo.icon}
                              color={iconInfo.color}
                              boxSize={5}
                              mr={2}
                              strokeWidth={iconInfo.strokeWidth ?? 2}
                            />
                            <Text as="span">{iconInfo.label}</Text>
                          </Box>
                        </Tooltip>
                      ) : (
                        invite.invitation_status
                      )}
                    </Table.Cell>

                    <Table.Cell>
                      {invite.invited_by?.username ||
                        invite.invited_by?.email ||
                        "Unknown"}
                    </Table.Cell>

                    <Table.Cell>
                      {new Date(invite.created_at).toLocaleDateString()}
                    </Table.Cell>

                    <Table.Cell>
                      {invite.accept_url ? (
                        <HStack gap={1}>
                          <Text fontSize="xs" color="gray.500" maxW="160px" truncate>
                            {invite.accept_url}
                          </Text>
                          <Tooltip content="Copy invite link" positioning={{ placement: "top" }} showArrow>
                            <IconButton
                              aria-label="Copy invite link"
                              size="2xs"
                              variant="ghost"
                              onClick={() => handleCopyLink(invite.accept_url!)}
                            >
                              <IconCopy size={13} />
                            </IconButton>
                          </Tooltip>
                        </HStack>
                      ) : (
                        <Text fontSize="xs" color="gray.400">—</Text>
                      )}
                    </Table.Cell>

                    <Table.Cell>
                      {invite.invitation_status !== "joined" && (
                        <Tooltip content="Delete invitation" positioning={{ placement: "top" }} showArrow>
                          <IconButton
                            aria-label="Delete invitation"
                            size="2xs"
                            variant="ghost"
                            colorScheme="red"
                            loading={deletingId === invite.id}
                            onClick={() => handleDeleteInvite(invite.id)}
                          >
                            <IconTrash size={13} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>

          </Table.Root>
        </Box>
      )}
    </Box>
  );
}

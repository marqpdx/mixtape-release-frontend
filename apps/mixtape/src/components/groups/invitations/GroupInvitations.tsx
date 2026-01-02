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
} from "@chakra-ui/react";
import { useEffect, useState, useCallback } from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import { Tooltip } from "@components/ui/tooltip";
import { GroupInvitation, invitationStatusIconMap } from "@mixtape/core/types/groupTypes";

// import { GroupInvitation, invitationStatusIconMap } from "./interfaces";

export interface GroupInvitationsProps {
  slug: string;
}

export default function GroupInvitations({
  slug,
}: GroupInvitationsProps) {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);

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

  console.log('invitations', invitations)

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
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Invited By</Table.ColumnHeader>
                <Table.ColumnHeader>Created At</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {invitations.map((invite) => {
                const iconInfo = invitationStatusIconMap[invite.invitation_status];

                return (
                  <Table.Row key={invite.id}>
                    <Table.Cell>{invite.invited_email}</Table.Cell>

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

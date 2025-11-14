// src/components/groups/GroupInvitations.tsx

"use client";

import {
  Box,
  Heading,
  Table,
  Text,
  HStack,
  Badge,
  Spinner,
  Icon,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { createStandaloneToast } from "@chakra-ui/toast";
import { Tooltip } from "@components/ui/tooltip";

import { GroupInvitation, invitationStatusIconMap } from "./interfaces";

export interface GroupInvitationsProps {
  slug: string;
}

const statusColorMap: Record<string, string> = {
  pending: "orange",
  joined: "green",
  declined: "red",
  expired: "gray",
};

const statusLabelMap: Record<string, string> = {
  pending: "Pending",
  joined: "Joined",
  declined: "Declined",
  expired: "Expired",
};

export default function GroupInvitations({
  slug,
}: GroupInvitationsProps) {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = createStandaloneToast();

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/api/groups/${slug}/invitations`
      );
      setInvitations(res.data.results || res.data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load invitations.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

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
                          placement="top"
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

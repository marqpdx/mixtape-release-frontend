"use client";

import {
  Box,
  Button,
  HStack,
  Heading,
  Input,
  Spinner,
  Table,
  Text,
  Textarea,
  VStack,
  Icon,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import { Group, GroupInvitation, invitationStatusIconMap } from "@mixtape/core/types/groupTypes";
import * as groupApi from "@mixtape/api/clients/group/groupApi";
import { Tooltip } from "@components/ui/tooltip";

interface CoalitionInviteWorkAreaProps {
  group: Group;
}

type InviteAction = "accept" | "decline";

export default function CoalitionInviteWorkArea({ group }: CoalitionInviteWorkAreaProps) {
  const isCoalition = group.group_type === "coalition";
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <Box>
      <Heading size="md" mb={4}>
        Coalition Invitations
      </Heading>

      <VStack align="stretch" gap={6}>
        {isCoalition ? (
          <CoalitionInviteForm coalitionSlug={group.slug} onSuccess={handleRefresh} />
        ) : (
          <CoalitionJoinRequestForm requestingGroupSlug={group.slug} onSuccess={handleRefresh} />
        )}

        <CoalitionInvitationsList
          key={refreshKey}
          group={group}
          onRefresh={handleRefresh}
        />
      </VStack>
    </Box>
  );
}

function CoalitionInviteForm({
  coalitionSlug,
  onSuccess,
}: {
  coalitionSlug: string;
  onSuccess: () => void;
}) {
  const [invitedGroupSlug, setInvitedGroupSlug] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMatches = useCallback(async () => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      const results = await groupApi.fetchGroups({
        search: term,
        is_active: true,
        exclude: ["unlisted"],
      });
      setSearchResults(results.filter((group) => group.slug !== coalitionSlug));
    } catch (error) {
      console.error(error);
      setSearchError("Could not load matching groups.");
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm, coalitionSlug]);

  useEffect(() => {
    void fetchMatches();
  }, [fetchMatches]);

  const handleSubmit = async () => {
    if (!invitedGroupSlug.trim()) {
      toaster.create({
        title: "Missing group",
        description: "Enter the slug of the group you want to invite.",
        type: "warning",
        duration: 4000,
      });
      return;
    }

    try {
      setSubmitting(true);
      await axiosInstance.post(`/api/groups/${coalitionSlug}/coalition-invitations/invite`, {
        invited_group_slug: invitedGroupSlug.trim(),
        message,
      });
      toaster.create({
        title: "Invitation sent",
        description: "The group has been invited to join this coalition.",
        type: "success",
        duration: 4000,
      });
      setInvitedGroupSlug("");
      setMessage("");
      onSuccess();
    } catch (error) {
      console.error(error);
      toaster.create({
        title: "Invite failed",
        description: "Could not send the coalition invitation.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Heading size="sm" mb={2}>
        Invite a group to this coalition
      </Heading>
      <Text mb={3} color="gray.600">
        Search by title or slug, or paste a slug directly. Unlisted groups are hidden.
      </Text>
      <VStack align="stretch" gap={3}>
        <Input
          placeholder="Search groups by title or slug"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchLoading && (
          <HStack>
            <Spinner size="sm" />
            <Text fontSize="sm" color="gray.500">Searching…</Text>
          </HStack>
        )}
        {searchError && (
          <Text fontSize="sm" color="red.500">{searchError}</Text>
        )}
        {searchResults.length > 0 && (
          <Box border="1px solid" borderColor="gray.200" rounded="md" overflow="hidden">
            {searchResults.slice(0, 6).map((group) => (
              <Box
                key={group.id}
                p={3}
                borderBottom="1px solid"
                borderColor="gray.100"
                _last={{ borderBottom: "none" }}
                _hover={{ bg: "green.50" }}
                cursor="pointer"
                onClick={() => setInvitedGroupSlug(group.slug)}
              >
                <Text fontWeight="medium">{group.title}</Text>
                <Text fontSize="sm" color="gray.500">{group.slug}</Text>
              </Box>
            ))}
          </Box>
        )}
        <Input
          placeholder="group-slug"
          value={invitedGroupSlug}
          onChange={(e) => setInvitedGroupSlug(e.target.value)}
        />
        <Textarea
          placeholder="Optional message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          resize="vertical"
        />
        <HStack justify="flex-end">
          <Button
            colorScheme="green"
            onClick={handleSubmit}
            loading={submitting}
          >
            Send invite
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

function CoalitionJoinRequestForm({
  requestingGroupSlug,
  onSuccess,
}: {
  requestingGroupSlug: string;
  onSuccess: () => void;
}) {
  const [coalitionSlug, setCoalitionSlug] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!coalitionSlug.trim()) {
      toaster.create({
        title: "Missing coalition",
        description: "Enter the slug of the coalition you want to join.",
        type: "warning",
        duration: 4000,
      });
      return;
    }

    try {
      setSubmitting(true);
      await axiosInstance.post(`/api/groups/${coalitionSlug}/coalition-invitations/request`, {
        requesting_group_slug: requestingGroupSlug,
        message,
      });
      toaster.create({
        title: "Request sent",
        description: "Your join request has been sent to the coalition admins.",
        type: "success",
        duration: 4000,
      });
      setCoalitionSlug("");
      setMessage("");
      onSuccess();
    } catch (error) {
      console.error(error);
      toaster.create({
        title: "Request failed",
        description: "Could not send the join request.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Heading size="sm" mb={2}>
        Request to join a coalition
      </Heading>
      <Text mb={3} color="gray.600">
        Enter the slug of the coalition you want this group to join. Coalition admins will review the request.
      </Text>
      <VStack align="stretch" gap={3}>
        <Input
          placeholder="coalition-slug"
          value={coalitionSlug}
          onChange={(e) => setCoalitionSlug(e.target.value)}
        />
        <Textarea
          placeholder="Optional message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          resize="vertical"
        />
        <HStack justify="flex-end">
          <Button
            colorScheme="green"
            onClick={handleSubmit}
            loading={submitting}
          >
            Send request
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

function CoalitionInvitationsList({
  group,
  onRefresh,
}: {
  group: Group;
  onRefresh: () => void;
}) {
  const isCoalition = group.group_type === "coalition";
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const listEndpoint = useMemo(() => {
    return isCoalition
      ? `/api/groups/${group.slug}/coalition-invitations`
      : `/api/groups/${group.slug}/coalition-invitations/received`;
  }, [group.slug, isCoalition]);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(listEndpoint);
      setInvitations(res.data.results || res.data);
    } catch (error) {
      console.error(error);
      toaster.create({
        title: "Error",
        description: "Failed to load coalition invitations.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [listEndpoint]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleRespond = async (invitationId: number, action: InviteAction) => {
    try {
      setActionLoading(invitationId);
      await axiosInstance.post(`/api/groups/coalition-invitations/${invitationId}/respond`, {
        action,
      });
      toaster.create({
        title: action === "accept" ? "Accepted" : "Declined",
        description: "Coalition invitation updated.",
        type: "success",
        duration: 4000,
      });
      onRefresh();
      await fetchInvitations();
    } catch (error) {
      console.error(error);
      toaster.create({
        title: "Update failed",
        description: "Could not update the invitation.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const renderActions = (invite: GroupInvitation) => {
    if (invite.invitation_status !== "pending") return "—";

    if (isCoalition && invite.invitation_kind === "request") {
      return (
        <HStack>
          <Button
            size="sm"
            colorScheme="green"
            onClick={() => handleRespond(invite.id, "accept")}
            loading={actionLoading === invite.id}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRespond(invite.id, "decline")}
            loading={actionLoading === invite.id}
          >
            Decline
          </Button>
        </HStack>
      );
    }

    if (!isCoalition && invite.invitation_kind === "invite") {
      return (
        <HStack>
          <Button
            size="sm"
            colorScheme="green"
            onClick={() => handleRespond(invite.id, "accept")}
            loading={actionLoading === invite.id}
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRespond(invite.id, "decline")}
            loading={actionLoading === invite.id}
          >
            Decline
          </Button>
        </HStack>
      );
    }

    return "Waiting";
  };

  return (
    <Box>
      <Heading size="sm" mb={3}>
        {isCoalition ? "Coalition requests" : "Coalition invitations"}
      </Heading>

      {loading ? (
        <HStack justify="center" py={8}>
          <Spinner size="lg" />
        </HStack>
      ) : invitations.length === 0 ? (
        <Text color="gray.500">
          {isCoalition
            ? "No coalition requests or invitations yet."
            : "No coalition invitations or requests yet."}
        </Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Coalition</Table.ColumnHeader>
                <Table.ColumnHeader>Group</Table.ColumnHeader>
                <Table.ColumnHeader>Kind</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {invitations.map((invite) => {
                const iconInfo = invitationStatusIconMap[invite.invitation_status];
                const coalitionName = invite.group_detail?.title || "Unknown";
                const invitedGroupName = invite.invited_group?.title || "Unknown";
                const kindLabel = invite.invitation_kind === "request" ? "Request" : "Invite";

                return (
                  <Table.Row key={invite.id}>
                    <Table.Cell>{coalitionName}</Table.Cell>
                    <Table.Cell>{invitedGroupName}</Table.Cell>
                    <Table.Cell>{kindLabel}</Table.Cell>
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
                    <Table.Cell>{renderActions(invite)}</Table.Cell>
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

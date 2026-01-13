// apps/mixtape/src/components/groups/tabs/GroupOverviewTab.tsx

"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarGroup, Box, Button, Card, Flex, Heading, Stack, Text, Badge, Grid } from "@chakra-ui/react";
import type { Group } from "@mixtape/core/types/groupTypes";
import { useMembers } from "@mixtape/api/hooks";

interface GroupOverviewTabProps {
  group: Group;
}

export function GroupOverviewTab({ group }: GroupOverviewTabProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const description = group.summary?.trim() || group.description?.trim() || "No summary provided yet.";
  const shouldTruncate = description.length > 320;
  const displayDescription =
    shouldTruncate && !showFullDescription
      ? `${description.slice(0, 320)}...`
      : description;
  const { adminMembers, stewardMembers, isLoading: membersLoading } = useMembers(group.slug);

  const leadership = useMemo(() => {
    const admins = adminMembers;
    const stewards = stewardMembers.filter(
      (member) => !member.roles.includes("admin")
    );
    return { admins, stewards };
  }, [adminMembers, stewardMembers]);

  const renderLeaderRow = (label: string, members: typeof adminMembers) => (
    <Stack gap={2}>
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      {membersLoading ? (
        <Text fontSize="sm" color="fg.muted">
          Loading...
        </Text>
      ) : members.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          None yet
        </Text>
      ) : (
        <Stack gap={2}>
          {members.map((member) => {
            const displayName =
              member.display_name || member.username || "Member";
            const initial = displayName.charAt(0).toUpperCase();
            return (
              <Flex key={member.member_id} align="center" gap={3}>
                <AvatarGroup>
                  <Avatar.Root size="sm">
                    {member.profile_image ? (
                      <Avatar.Image src={member.profile_image} alt={displayName} />
                    ) : (
                      <Avatar.Fallback>{initial}</Avatar.Fallback>
                    )}
                  </Avatar.Root>
                </AvatarGroup>
                <Text fontWeight="medium">{displayName}</Text>
              </Flex>
            );
          })}
        </Stack>
      )}
    </Stack>
  );

  return (
    <Stack gap={6}>
      <Grid templateColumns={{ base: "1fr", lg: "3fr 2fr" }} gap={6}>
        <Stack gap={6}>
          <Card.Root>
            <Card.Header>
              <Heading size="lg">Recent Activity</Heading>
            </Card.Header>
            <Card.Body>
              <Text color="fg.muted">Recent activity is coming soon.</Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="md">Highlights</Heading>
            </Card.Header>
            <Card.Body>
              <Text color="fg.muted">Highlights are coming soon.</Text>
            </Card.Body>
          </Card.Root>
        </Stack>

        <Stack gap={6}>
          <Card.Root>
            <Card.Header>
              <Heading size="lg">About this Group</Heading>
            </Card.Header>
            <Card.Body>
              <Text whiteSpace="pre-line" color="fg.muted">
                {displayDescription}
              </Text>
              {shouldTruncate && (
                <Button
                  variant="ghost"
                  size="sm"
                  mt={2}
                  onClick={() => setShowFullDescription((prev) => !prev)}
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </Button>
              )}
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="md">Leadership</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                {renderLeaderRow("Admins", leadership.admins)}
                {renderLeaderRow("Stewards", leadership.stewards)}
              </Stack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="md">Details</Heading>
            </Card.Header>
            <Card.Body>
              <Flex wrap="wrap" gap={3}>
                <Badge size="sm" variant="subtle">
                  {group.group_type}
                </Badge>
                <Badge size="sm" variant="subtle">
                  {group.visibility}
                </Badge>
                <Badge size="sm" variant="subtle">
                  {group.is_active ? "Active" : "Inactive"}
                </Badge>
              </Flex>
              <Stack gap={2} mt={4}>
                <Box>
                  <Text fontSize="sm" color="fg.muted">
                    Members
                  </Text>
                  <Text fontWeight="semibold">{group.member_count ?? "—"}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="fg.muted">
                    Created
                  </Text>
                  <Text fontWeight="semibold">{group.created_at ?? "—"}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="fg.muted">
                    Updated
                  </Text>
                  <Text fontWeight="semibold">{group.updated_at ?? "—"}</Text>
                </Box>
              </Stack>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Grid>
    </Stack>
  );
}

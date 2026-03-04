// src/components/groups/tabs/LandingTab.tsx

import {
  GridItem,
  Grid,
  Card,
  Heading,
  Text,
  Button,
  VStack,
  Flex,
  HStack,
  AvatarGroup,
  Avatar,
  Link,
  Stack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { IconCalendar, IconShoppingBag, IconFolder } from "@tabler/icons-react";
import NextLink from "next/link";
import React from "react";
import type { Group } from "@mixtape/core/types/groupTypes";
import { useStall } from "@mixtape/api/hooks/useBazaar";
import { useMembers } from "@mixtape/api/hooks/useMembers";
import { useCollections } from "@mixtape/api/hooks/stackroom/useCollections";

export function LandingTab({ group }: { group: Group; onJoinGroup?: () => void }) {
  void useColorModeValue('white', 'gray.800');
  const sidebarBg = useColorModeValue('gray.50', 'gray.700');
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  const { stall } = useStall("group", group.id);
  const { adminMembers, stewardMembers, isLoading: membersLoading } = useMembers(group.slug);
  const { collections } = useCollections({ sponsor_type: 'group', sponsor_id: group.id });

  const description = group.description || "No description provided.";
  const shouldTruncate = description.length > 300;
  const displayDescription = shouldTruncate && !showFullDescription
    ? description.substring(0, 300) + "..."
    : description;

  const leadership = React.useMemo(() => {
    const stewards = stewardMembers.filter(
      (member) => !member.roles.includes("admin")
    );
    return { admins: adminMembers, stewards };
  }, [adminMembers, stewardMembers]);

  const allLeaders = [...leadership.admins, ...leadership.stewards];

  const totalItems = collections?.reduce((sum, c) => sum + (c.item_count || 0), 0) ?? 0;

  return (
    <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={4}>
      <GridItem>
        <VStack align="stretch" gap={4}>
          <Card.Root>
            <Card.Header>
              <Heading size="md">About This Group</Heading>
            </Card.Header>
            <Card.Body>
              <Text whiteSpace="pre-line" lineHeight="tall">
                {displayDescription}
              </Text>
              {shouldTruncate && (
                <Button
                  variant="ghost"
                  size="sm"
                  mt={2}
                  onClick={() => setShowFullDescription(!showFullDescription)}
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                </Button>
              )}
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Flex justify="space-between" align="center">
                <Heading size="md">Upcoming Events</Heading>
                <IconCalendar size={16} />
              </Flex>
            </Card.Header>
            <Card.Body>
              <Text color="fg.muted">No upcoming events yet.</Text>
            </Card.Body>
          </Card.Root>
        </VStack>
      </GridItem>

      <GridItem>
        <VStack align="stretch" gap={4}>
          <Card.Root bg={sidebarBg}>
            <Card.Header>
              <Heading size="sm">Group Stewards</Heading>
            </Card.Header>
            <Card.Body>
              {membersLoading ? (
                <Text fontSize="sm" color="fg.muted">Loading...</Text>
              ) : allLeaders.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">None yet</Text>
              ) : (
                <Stack gap={3}>
                  {allLeaders.map((member) => {
                    const displayName = member.display_name || member.username || "Member";
                    const initial = displayName.charAt(0).toUpperCase();
                    const role = member.roles.includes("admin") ? "Admin" : "Steward";
                    return (
                      <HStack key={member.member_id}>
                        <AvatarGroup>
                          <Avatar.Root size="sm">
                            {member.profile_image ? (
                              <Avatar.Image src={member.profile_image} alt={displayName} />
                            ) : (
                              <Avatar.Fallback>{initial}</Avatar.Fallback>
                            )}
                          </Avatar.Root>
                        </AvatarGroup>
                        <VStack align="start" gap={0}>
                          <Text fontSize="sm" fontWeight="bold">{displayName}</Text>
                          <Text fontSize="xs" color="gray.500">{role}</Text>
                        </VStack>
                      </HStack>
                    );
                  })}
                </Stack>
              )}
            </Card.Body>
          </Card.Root>

          {/* Resources — linked to collections */}
          <Card.Root bg={sidebarBg}>
            <Card.Header>
              <Flex align="center" gap={2}>
                <IconFolder size={18} />
                <Heading size="sm">Resources</Heading>
              </Flex>
            </Card.Header>
            <Card.Body>
              {!collections || collections.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">No collections yet.</Text>
              ) : (
                <VStack align="stretch" gap={2}>
                  <Text fontSize="sm" color="fg.muted">
                    {collections.length} {collections.length === 1 ? "collection" : "collections"} with {totalItems} {totalItems === 1 ? "item" : "items"}
                  </Text>
                  {collections.slice(0, 3).map((c) => (
                    <Text key={c.id} fontSize="sm" fontWeight="medium">{c.title}</Text>
                  ))}
                </VStack>
              )}
            </Card.Body>
          </Card.Root>

          {/* Bazaar Stall */}
          {stall && stall.offerings_count > 0 && (
            <Card.Root bg={sidebarBg}>
              <Card.Header>
                <Flex align="center" gap={2}>
                  <IconShoppingBag size={18} />
                  <Heading size="sm">Bazaar</Heading>
                </Flex>
              </Card.Header>
              <Card.Body>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  {stall.offerings_count} {stall.offerings_count === 1 ? "offering" : "offerings"} available
                </Text>
                <Link as={NextLink} href={`/groups/${group.slug}/stall`}>
                  <Button size="sm" variant="outline" width="full">
                    <IconShoppingBag size={16} />
                    View Stall
                  </Button>
                </Link>
              </Card.Body>
            </Card.Root>
          )}
        </VStack>
      </GridItem>
    </Grid>
  );
}

// src/components/groups/tabs/LandingTab.tsx

import { GroupNoticeboard } from "../GroupNoticeboard";
import {
  GridItem,
  Grid,
  Card,
  Heading,
  Text,
  Button,
  VStack,
  Box,
  Flex,
  HStack,
  SimpleGrid,
  AvatarGroup,
  Avatar,
  Link,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { IconCalendar, IconPhoto, IconExternalLink } from "@tabler/icons-react";
import React from "react";

export function LandingTab({ group, isMember, onJoinGroup }: { group: any; isMember: boolean; onJoinGroup?: () => void }) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const sidebarBg = useColorModeValue('gray.50', 'gray.700');
  const [showFullDescription, setShowFullDescription] = React.useState(false);

  const description = group.description || "No description provided.";
  const shouldTruncate = description.length > 300;
  const displayDescription = shouldTruncate && !showFullDescription
    ? description.substring(0, 300) + "..."
    : description;

  const canJoin = group.visibility === 'public' && group.join_policy !== 'closed';

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

          <GroupNoticeboard groupSlug={group.slug} />

          <Card.Root>
            <Card.Header>
              <Flex justify="space-between" align="center">
                <Heading size="md">Upcoming Events</Heading>
                <Button variant="ghost" size="sm">
                  <IconCalendar size={16} style={{ marginRight: '4px' }} />
                  View calendar
                </Button>
              </Flex>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={3}>
                {[1, 2, 3].map((i) => (
                  <HStack key={i} p={3} borderWidth="1px" borderRadius="md">
                    <Box textAlign="center" minW="60px">
                      <Text fontSize="sm" fontWeight="bold">Dec</Text>
                      <Text fontSize="xl" fontWeight="bold">{15 + i}</Text>
                    </Box>
                    <VStack align="start" gap={0} flex="1">
                      <Text fontWeight="bold">Community Workshop {i}</Text>
                      <Text fontSize="sm" color="gray.600">2:00 PM - 4:00 PM</Text>
                      <Text fontSize="sm" color="gray.500">Online Event</Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Flex justify="space-between" align="center">
                <Heading size="md">Group Photos</Heading>
                <Button variant="ghost" size="sm">
                  <IconPhoto size={16} style={{ marginRight: '4px' }} />
                  Open gallery
                </Button>
              </Flex>
            </Card.Header>
            <Card.Body>
              <SimpleGrid columns={3} gap={2}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Box
                    key={i}
                    h="100px"
                    bg="gray.200"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <IconPhoto size={24} color="gray.500" />
                  </Box>
                ))}
              </SimpleGrid>
            </Card.Body>
          </Card.Root>
        </VStack>
      </GridItem>

      <GridItem>
        <VStack align="stretch" gap={4}>
          {!isMember && canJoin && (
            <Card.Root bg={sidebarBg}>
              <Card.Body>
                <VStack gap={3}>
                  <Heading size="sm" textAlign="center">Join this community</Heading>
                  <Button
                    colorScheme="green"
                    size="lg"
                    w="full"
                    onClick={onJoinGroup}
                  >
                    Join Group
                  </Button>
                  <Button variant="outline" size="md" w="full">
                    Follow
                  </Button>
                </VStack>
              </Card.Body>
            </Card.Root>
          )}

          <Card.Root bg={sidebarBg}>
            <Card.Header>
              <Heading size="sm">Group Stewards</Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={3}>
                {[1, 2].map((i) => (
                  <HStack key={i}>
                    <AvatarGroup>
                      <Avatar.Root size="sm">
                        <Avatar.Fallback>S{i}</Avatar.Fallback>
                      </Avatar.Root>
                    </AvatarGroup>
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="bold">Steward Name</Text>
                      <Text fontSize="xs" color="gray.500">Group Admin</Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root bg={sidebarBg}>
            <Card.Header>
              <Heading size="sm">Featured Course</Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="start" gap={2}>
                <Text fontWeight="bold">Permaculture Basics</Text>
                <Text fontSize="sm" color="gray.600">
                  Learn the fundamentals of sustainable design
                </Text>
                <Button size="sm" variant="outline" w="full">
                  Learn More
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root bg={sidebarBg}>
            <Card.Header>
              <Heading size="sm">Connect</Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={2}>
                <Link href="#" fontSize="sm">
                  <HStack>
                    <IconExternalLink size={14} />
                    <Text>Website</Text>
                  </HStack>
                </Link>
                <Link href="#" fontSize="sm">
                  <HStack>
                    <IconExternalLink size={14} />
                    <Text>Discord</Text>
                  </HStack>
                </Link>
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </GridItem>
    </Grid>
  );
}
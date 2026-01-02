// src/components/groups/tabs/ConnectionsTab.tsx
"use client";

import React from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  Badge,
  Stack,
  Grid,
  Card,
  VStack,
} from "@chakra-ui/react";
import {
  IconMessageCircle,
  IconMessage,
  IconPin,
  IconWorld,
} from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { Divider } from "@components/common/Divider";
import type { Group } from "@mixtape/core/types/groupTypes";

export function ConnectionsTab({ group }: { group: Group }) {
  const cardBg = useColorModeValue('white', 'gray.800');
  void group;

  return (
    <Stack gap={6}>
      <Box>
        <Heading size="lg" mb={2}>Connections</Heading>
        <Text color="gray.600">
          Stay connected with your community through discussions, chats, and announcements
        </Text>
      </Box>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
        <Card.Root bg={cardBg} _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s" cursor="pointer">
          <Card.Header>
            <VStack align="start" gap={2}>
              <Box p={3} bg="orange.50" borderRadius="lg">
                <IconMessageCircle size={32} color="var(--chakra-colors-orange-500)" />
              </Box>
              <Heading size="md">Discussions</Heading>
            </VStack>
          </Card.Header>
          <Card.Body>
            <VStack align="start" gap={3}>
              <Text fontSize="sm" color="gray.600">
                Engage in threaded conversations and long-form discussions
              </Text>
              <Divider />
              <Box w="full">
                <Flex justifyContent="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="semibold">Active Topics</Text>
                  <Badge colorScheme="orange">47</Badge>
                </Flex>
                <Text fontSize="xs" color="gray.500">12 new replies today</Text>
              </Box>
              <Button size="sm" variant="outline" w="full" colorScheme="orange">
                Browse Discussions
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>

        <Card.Root bg={cardBg} _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s" cursor="pointer">
          <Card.Header>
            <VStack align="start" gap={2}>
              <Box p={3} bg="purple.50" borderRadius="lg">
                <IconMessage size={32} color="var(--chakra-colors-purple-500)" />
              </Box>
              <Heading size="md">Chats</Heading>
            </VStack>
          </Card.Header>
          <Card.Body>
            <VStack align="start" gap={3}>
              <Text fontSize="sm" color="gray.600">
                Real-time messaging with group members
              </Text>
              <Divider />
              <Box w="full">
                <Flex justifyContent="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="semibold">Active Chats</Text>
                  <Badge colorScheme="purple">8</Badge>
                </Flex>
                <Text fontSize="xs" color="gray.500">23 unread messages</Text>
              </Box>
              <Button size="sm" variant="outline" w="full" colorScheme="purple">
                Open Chats
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>

        <Card.Root bg={cardBg} _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s" cursor="pointer">
          <Card.Header>
            <VStack align="start" gap={2}>
              <Box p={3} bg="green.50" borderRadius="lg">
                <IconPin size={32} color="var(--chakra-colors-green-500)" />
              </Box>
              <Heading size="md">Announcements</Heading>
            </VStack>
          </Card.Header>
          <Card.Body>
            <VStack align="start" gap={3}>
              <Text fontSize="sm" color="gray.600">
                Important updates from group stewards
              </Text>
              <Divider />
              <Box w="full">
                <Flex justifyContent="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="semibold">Recent Posts</Text>
                  <Badge colorScheme="green">5</Badge>
                </Flex>
                <Text fontSize="xs" color="gray.500">Last posted 2 days ago</Text>
              </Box>
              <Button size="sm" variant="outline" w="full" colorScheme="green">
                View All
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Grid>

      <Card.Root bg={cardBg} borderStyle="dashed" borderWidth="2px" borderColor="gray.300">
        <Card.Body>
          <VStack gap={3}>
            <Box p={3} bg="blue.50" borderRadius="lg">
              <IconWorld size={32} color="var(--chakra-colors-blue-500)" />
            </Box>
            <Heading size="sm">Geospatial (Coming Soon)</Heading>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              Connect with members based on location
            </Text>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}

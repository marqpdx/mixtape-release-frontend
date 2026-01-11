// src/components/groups/GroupOverview.tsx
import React from 'react';
import { VStack, HStack, Text, Button, SimpleGrid, Stat } from '@chakra-ui/react';
import { Card } from '@chakra-ui/react';
import WorkAreaWrapper from '@components/dashboard/shared/WorkAreaWrapper';

interface GroupOverviewProps {
  group: {
    member_count?: number | null;
  };
  userRole: string;
  onNavigate: (section: string) => void;
}

export default function GroupOverview({ group, userRole, onNavigate }: GroupOverviewProps) {
  return (
    <WorkAreaWrapper>
      <VStack align="stretch" gap={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Group Overview
        </Text>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
          <Card.Root>
            <Card.Body>
              <Stat.Root>
                <Stat.Label>Total Members</Stat.Label>
                <Stat.ValueText>{group.member_count || 0}</Stat.ValueText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <Stat.Root>
                <Stat.Label>Active Posts</Stat.Label>
                <Stat.ValueText>12</Stat.ValueText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <Stat.Root>
                <Stat.Label>Your Role</Stat.Label>
                <Stat.ValueText>{userRole}</Stat.ValueText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        <Card.Root>
          <Card.Header>
            <Text fontSize="lg" fontWeight="semibold">Quick Actions</Text>
          </Card.Header>
          <Card.Body>
            <HStack gap={4} flexWrap="wrap">
              <Button
                colorScheme="green"
                onClick={() => onNavigate('members-roles')}
              >
                Manage Members
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => onNavigate('events')}
              >
                View Events
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate('group-courses')}
              >
                Manage Courses
              </Button>
            </HStack>
          </Card.Body>
        </Card.Root>

        <Text color="theme.textSecondary">
          Group overview dashboard coming soon with more detailed analytics and insights.
        </Text>
      </VStack>
    </WorkAreaWrapper>
  );
}

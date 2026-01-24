// apps/mixtape/src/components/groups/GroupOverview.tsx
import React from 'react';
import { VStack, HStack, Text, Button, SimpleGrid, Stat, Box, Collapsible } from '@chakra-ui/react';
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

        <Card.Root>
          <Card.Header>
            <Collapsible.Root defaultOpen>
              <Collapsible.Trigger asChild>
                <Button variant="outline" size="sm" width="full" justifyContent="space-between">
                  Welcome & setup checklist
                  <Collapsible.Indicator />
                </Button>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Box pt={4}>
                  <Text color="theme.textSecondary" mb={3}>
                    Start by publishing a Welcome post so members know what to expect.
                  </Text>
                  <VStack align="stretch" gap={2} color="theme.textSecondary">
                    <Text>• Add a Welcome post in Writing (make it your first pinned message).</Text>
                    <Text>• Complete Group Edit fields: title, description, tagline, visibility.</Text>
                    <Text>• Upload a profile image for member views and a banner image for the community view.</Text>
                    <Text>• Invite members and assign steward roles as needed.</Text>
                    <Text>• Curate Collections to share resources and highlights.</Text>
                  </VStack>
                </Box>
              </Collapsible.Content>
            </Collapsible.Root>
          </Card.Header>
        </Card.Root>

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

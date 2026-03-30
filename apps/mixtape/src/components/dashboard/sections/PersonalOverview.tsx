// apps/mixtape/src/components/dashboard/sections/PersonalOverview.tsx

"use client";

import { UserIdentity } from "@mixtape/core/types/auth";
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Card,
  Badge,
  SimpleGrid,
  Avatar,
  Button,
  Progress,
  GridItem,
} from "@chakra-ui/react";
// import { UserIdentity } from "@components/auth/interfaces";
import { useColorModeValue } from "@components/ui/color-mode";
import { IconBell, IconEdit, IconMail, IconNote, IconUsers } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
// import { Button } from "@theme/recipes/button.recipe";

interface ToDoItem {
  id: number;
  title: string;
  is_completed: boolean;
  completed_date: string | null;
}

interface PersonalOverviewProps {
  identity: UserIdentity;
  groups: Array<{
    id: string | number;
    name?: string;
    member_count?: number;
    role?: string;
  }>;
  todos?: ToDoItem[];
  isAdmin: boolean;
  isSteward: boolean;
  setActiveSection?: (section: string, params?: Record<string, string>) => void;
}

export default function PersonalOverview({
  identity,
  groups,
  todos = [],
  isAdmin,
  isSteward,
  setActiveSection,
}: PersonalOverviewProps) {
  const router = useRouter();
  const incompleteTodos = todos.filter(todo => !todo.is_completed);
  const completedTodos = todos.filter(todo => todo.is_completed);
  const completionRate = todos.length > 0 ? (completedTodos.length / todos.length) * 100 : 0;

  const textColor = useColorModeValue('gray.800', 'gray.200');
  void textColor;
  const mutedTextColor = useColorModeValue('gray.700', 'gray.300');
  const subtleTextColor = useColorModeValue('gray.600', 'gray.400');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getUserTitle = () => {
    if (isAdmin) return "Administrator";
    if (isSteward) return "Community Steward";
    return "Community Member";
  };

  return (
    <VStack align="stretch" gap={6}>
      {/* Welcome Header - Remove redundant text */}
      <Box>
        <Heading size="xl" mb={2}>
          {getGreeting()}, {identity.first_name || identity.username}! 👋
        </Heading>
      </Box>

  {/* Split Profile + Activity - 50/50 */}
  <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
    {/* Profile Card - 50% width */}
    <GridItem>
      <Box
        bg="bg.surface"
        borderColor="border.borderBox"
        borderWidth={1}
        borderRadius="md"
        p={1}
        h="full"
        display="flex"
        flexDirection="column"
      >
        <Card.Root bg="transparent" border="none" shadow="none" flex="1">
          <Card.Body display="flex" flexDirection="column" position="relative">
            <HStack gap={4} align="start" flex="1">
              <Avatar.Root size="lg">
                {/* {identity.profile?.profile_image && (
                  <Avatar.Image src={identity.profile.profile_image} alt={identity.username} />
                )} */}
                <Avatar.Fallback>
                  {(identity.first_name?.[0] || identity.username[0]).toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
              <VStack align="start" gap={1} flex="1">
                <Heading size="lg">
                  {identity.profile?.display_name || `${identity.first_name} ${identity.last_name}` || identity.username}
                </Heading>
                <Text color={subtleTextColor}>@{identity.username}</Text>
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" color={subtleTextColor}>
                    Member since {formatDate(identity.date_joined)}
                  </Text>
                  <Badge colorScheme="green">{getUserTitle()}</Badge>
                </VStack>
              </VStack>
            </HStack>
            <Button
              size="xs"
              position="absolute"
              bottom={0}
              right={0}
              onClick={() => {
                if (setActiveSection) {
                  setActiveSection("edit-profile");
                  return;
                }
                router.push(`/member/${identity.username}`);
              }}
            >
              <HStack>
                <IconEdit size={16} />
                <Text>Edit Profile</Text>
              </HStack>
            </Button>
          </Card.Body>
        </Card.Root>
      </Box>
    </GridItem>

    {/* Activity Mini-Panel - 50% width */}
    <GridItem>
      <Box
        bg="bg.surface"
        borderColor="border.borderBox"
        borderWidth={1}
        borderRadius="md"
        p={1}
        h="full"
        display="flex"
        flexDirection="column"
      >
        <Card.Root bg="transparent" border="none" shadow="none" flex="1">
          <Card.Body display="flex" alignItems="center">
            <SimpleGrid columns={2} gap={4} w="full">
              <VStack gap={3} align="stretch">
                <HStack>
                  <IconMail size={16} />
                  <VStack align="start" gap={0} flex="1">
                    <Text fontSize="xs" color={mutedTextColor}>Unread Messages</Text>
                    <Badge colorScheme="purple" size="sm">3</Badge>
                  </VStack>
                </HStack>

                <HStack>
                  <IconUsers size={16} />
                  <VStack align="start" gap={0} flex="1">
                    <Text fontSize="xs" color={mutedTextColor}>Groups Activity</Text>
                    <Badge colorScheme="blue" size="sm">12</Badge>
                  </VStack>
                </HStack>
              </VStack>

              <VStack gap={3} align="stretch">
                <HStack>
                  <IconBell size={16} />
                  <VStack align="start" gap={0} flex="1">
                    <Text fontSize="xs" color={mutedTextColor}>Site Happenings</Text>
                    <Badge colorScheme="green" size="sm">5</Badge>
                  </VStack>
                </HStack>

                <HStack>
                  <IconNote size={16} />
                  <VStack align="start" gap={0} flex="1">
                    <Text fontSize="xs" color={mutedTextColor}>Writing Feedback</Text>
                    <Badge colorScheme="orange" size="sm">—</Badge>
                  </VStack>
                </HStack>
              </VStack>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>
      </Box>
    </GridItem>
  </SimpleGrid>



      {/* User Profile Card */}
      {/* <Box bg="bg.surface" borderColor="border.borderBox" borderWidth={1} borderRadius="md" p={1}>
        <Card.Root bg="transparent" border="none" shadow="none">
          <Card.Body>
            <HStack gap={4}>
              <Avatar.Root size="lg">
                <Avatar.Image
                  src={identity.profile?.profile_image}
                  alt={identity.username}
                />
                <Avatar.Fallback>
                  {(identity.first_name?.[0] || identity.username[0]).toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
              <VStack align="start" gap={1} flex={1}>
                <Heading size="md">
                  {identity.profile?.display_name || `${identity.first_name} ${identity.last_name}` || identity.username}
                </Heading>
                <Text color={subtleTextColor}>@{identity.username}</Text>
                <HStack gap={2}>
                  <Badge colorScheme="green">{getUserTitle()}</Badge>
                  <Badge variant="outline">
                    Member since {formatDate(identity.date_joined)}
                  </Badge>
                </HStack>
              </VStack>
              <Button
                size="sm"
                onClick={() => {
                  if (setActiveSection) {
                    setActiveSection("edit-profile");
                    return;
                  }
                  router.push(`/member/${identity.username}`);
                }}
              >
                Edit Profile
              </Button>
            </HStack>
          </Card.Body>
        </Card.Root>
      </Box> */}

      {/* Quick Stats Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
        {/* Groups */}
        <Box bg="bg.surface" borderColor="border.borderBox" borderWidth={1} borderRadius="md" p={1}>
          <Card.Root bg="transparent" border="none" shadow="none">
            <Card.Body textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {groups.length}
              </Text>
              <Text color={mutedTextColor}>Groups Joined</Text>
            </Card.Body>
          </Card.Root>
        </Box>

        {/* Learning Progress */}
        <Box bg="bg.surface" borderColor="border.borderBox" borderWidth={1} borderRadius="md" p={1}>
          <Card.Root bg="transparent" border="none" shadow="none">
            <Card.Body textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                3
              </Text>
              <Text color={mutedTextColor}>Courses Active</Text>
            </Card.Body>
          </Card.Root>
        </Box>

        {/* Community Contributions */}
        <Box bg="bg.surface" borderColor="border.borderBox" borderWidth={1} borderRadius="md" p={1}>
          <Card.Root bg="transparent" border="none" shadow="none">
            <Card.Body textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                12
              </Text>
              <Text color={mutedTextColor}>Contributions</Text>
            </Card.Body>
          </Card.Root>
        </Box>

        {/* Admin Tasks */}
        {(isAdmin || isSteward) && (
          <Box bg="bg.surface" borderColor="border.borderBox" borderWidth={1} borderRadius="md" p={1}>
            <Card.Root bg="transparent" border="none" shadow="none">
              <Card.Body textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {incompleteTodos.length}
                </Text>
                <Text color={mutedTextColor}>Tasks Pending</Text>
              </Card.Body>
            </Card.Root>
          </Box>
        )}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        {/* Recent Groups */}
        <Box bg="bg.surface" borderColor="border.borderBox" borderWidth={1} borderRadius="md" p={1}>
          <Card.Root bg="transparent" border="none" shadow="none">
            <Card.Header>
              <Heading size="md">My Groups</Heading>
            </Card.Header>
            <Card.Body>
              {groups.length > 0 ? (
                <VStack align="stretch" gap={3}>
                  {groups.slice(0, 3).map((group) => (
                    <Box key={group.id} p={3} borderRadius="md" bg="gray.50">
                      <HStack justify="space-between">
                        <VStack align="start" gap={0}>
                          <Text fontWeight="medium">{group.name}</Text>
                          <Text fontSize="sm" color={subtleTextColor}>
                            {group.member_count} members
                          </Text>
                        </VStack>
                        <Badge colorScheme="blue">{group.role || 'Member'}</Badge>
                      </HStack>
                    </Box>
                  ))}
                  {groups.length > 3 && (
                    <Button size="sm">
                      View all {groups.length} groups
                    </Button>
                  )}
                </VStack>
              ) : (
                <VStack gap={3} py={4}>
                  <Text color={subtleTextColor}>You haven't joined any groups yet</Text>
                  <Button size="sm">
                    Discover Groups
                  </Button>
                </VStack>
              )}
            </Card.Body>
          </Card.Root>
        </Box>

        {/* Admin Tasks */}
        {(isAdmin || isSteward) && todos.length > 0 && (
          <Box bg="bg.surface" borderColor="border.borderBox" borderWidth={1} borderRadius="md" p={1}>
            <Card.Root bg="transparent" border="none" shadow="none">
              <Card.Header>
                <HStack justify="space-between">
                  <Heading size="md">Admin Tasks</Heading>
                  <Badge colorScheme="orange">{incompleteTodos.length} pending</Badge>
                </HStack>
              </Card.Header>
              <Card.Body>
                <VStack align="stretch" gap={3}>
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm">Completion Progress</Text>
                      <Text fontSize="sm">{Math.round(completionRate)}%</Text>
                    </HStack>
                    <Progress.Root value={completionRate} size="sm">
                      <Progress.Track>
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>
                  </Box>

                  {incompleteTodos.slice(0, 3).map((todo) => (
                    <Box key={todo.id} p={3} borderRadius="md" bg="orange.50">
                      <Text fontSize="sm" fontWeight="medium">
                        {todo.title}
                      </Text>
                    </Box>
                  ))}

                  {incompleteTodos.length > 3 && (
                    <Button size="sm">
                      View all tasks
                    </Button>
                  )}
                </VStack>
              </Card.Body>
            </Card.Root>
          </Box>
        )}

        {/* Personal Calendar */}
        <Box bg="bg.surface" borderColor="border.borderBox" borderWidth={1} borderRadius="md" p={1}>
          <Card.Root bg="transparent" border="none" shadow="none">
            <Card.Header>
              <Heading size="md">My Calendar</Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={3}>
                <Text fontSize="sm" color={subtleTextColor}>
                  Your personal events will appear here alongside Crossroads gatherings.
                </Text>
                <Button size="sm">
                  Open calendar
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Box>

        {/* Recent Activity */}
        <Box bg="bg.surface" borderColor="border.borderBox" borderWidth={1} borderRadius="md" p={1}>
          <Card.Root bg="transparent" border="none" shadow="none">
            <Card.Header>
              <Heading size="md">Recent Activity</Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={3}>
                <Box p={3} borderRadius="md" bg="green.50">
                  <Text fontSize="sm" fontWeight="medium">
                    Joined "Permaculture Basics" group
                  </Text>
                  <Text fontSize="xs" color={subtleTextColor}>2 hours ago</Text>
                </Box>
                <Box p={3} borderRadius="md" bg="blue.50">
                  <Text fontSize="sm" fontWeight="medium">
                    Completed "Soil Health" lesson
                  </Text>
                  <Text fontSize="xs" color={subtleTextColor}>1 day ago</Text>
                </Box>
                <Box p={3} borderRadius="md" bg="purple.50">
                  <Text fontSize="sm" fontWeight="medium">
                    Posted in "Community Garden"
                  </Text>
                  <Text fontSize="xs" color={subtleTextColor}>3 days ago</Text>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Box>

        {/* Quick Actions */}
        <Box bg="bg.surface" borderColor="border.borderBox" borderWidth={1} borderRadius="md" p={1}>
          <Card.Root bg="transparent" border="none" shadow="none">
            <Card.Header>
              <Heading size="md">Quick Actions</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={3}>
                <Button w="full" size="sm">
                  Browse Courses
                </Button>
                <Button w="full" size="sm">
                  Find Groups
                </Button>
                <Button w="full" size="sm">
                  Update Profile
                </Button>
                {(isAdmin || isSteward) && (
                  <Button w="full" size="sm">
                    Admin Panel
                  </Button>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        </Box>
      </SimpleGrid>
    </VStack>
  );
}

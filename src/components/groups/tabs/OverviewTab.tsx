// src/components/groups/tabs/OverviewTab.tsx

"use client";

import React, { useState } from "react";
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
  AvatarGroup,
  Avatar,
} from "@chakra-ui/react";
import {
  IconBook,
  IconUsers,
  IconMessage,
  IconMessageCircle,
  IconCalendar,
  IconPhoto,
  IconSparkles,
  IconChevronRight,
} from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { Divider } from "@components/common/Divider";
// import { GroupNoticeboard } from "../GroupNoticeboard";

// Mock data - replace with real data
const activityFeed = [
  {
    id: '1',
    type: 'course_update',
    icon: IconBook,
    title: 'New module added to "Soil Science Basics"',
    description: 'Module 4: Composting Techniques is now available',
    timestamp: '5 minutes ago',
    color: 'green',
  },
  {
    id: '2',
    type: 'new_member',
    icon: IconUsers,
    title: 'Alex Kim joined the group',
    description: 'Welcome our newest member!',
    timestamp: '1 hour ago',
    color: 'blue',
  },
  {
    id: '3',
    type: 'chat_message',
    icon: IconMessage,
    title: 'New messages in "Weekend Gardening Crew"',
    description: '12 new messages',
    timestamp: '2 hours ago',
    color: 'purple',
  },
  {
    id: '4',
    type: 'threadworks_topic',
    icon: IconMessageCircle,
    title: 'New discussion: "Best perennials for shade"',
    description: 'Started by Marcus Johnson',
    timestamp: '3 hours ago',
    color: 'orange',
  },
];

const activeCourses = [
  {
    id: '1',
    title: 'Soil Science Basics',
    progress: 65,
    nextLesson: 'Module 4: Composting Techniques',
  },
  {
    id: '2',
    title: 'Water Management in Urban Settings',
    progress: 30,
    nextLesson: 'Module 2: Rainwater Harvesting',
  },
];

const upcomingEvents = [
  {
    id: '1',
    title: 'Spring Planting Workshop',
    date: 'Sat, Mar 15',
    time: '10:00 AM',
    attendees: 23,
  },
  {
    id: '2',
    title: 'Community Garden Workday',
    date: 'Sun, Mar 16',
    time: '9:00 AM',
    attendees: 18,
  },
];

export function OverviewTab({ group }: { group: any }) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [showFullDescription, setShowFullDescription] = useState(false);

  const description = group.description || "No description provided.";
  const shouldTruncate = description.length > 300;
  const displayDescription = shouldTruncate && !showFullDescription
    ? description.substring(0, 300) + "..."
    : description;

  return (
    <Stack gap={6}>
      {/* Noticeboard - Announcement Queue */}
      {/* <GroupNoticeboard groupSlug={group.slug} /> */}

      {/* Main Content Grid */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* Left Column */}
        <Stack gap={6}>
          {/* About Section */}
          <Card.Root bg={cardBg}>
            <Card.Header>
              <Heading size="lg">About this Group</Heading>
            </Card.Header>
            <Card.Body>
              <Text color="gray.600" whiteSpace="pre-line" lineHeight="tall">
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

          {/* Activity Feed */}
          <Card.Root bg={cardBg}>
            <Card.Header>
              <Flex justifyContent="space-between" alignItems="center">
                <Heading size="lg">Recent Activity</Heading>
                <Button size="sm" variant="ghost">
                  View All
                  <IconChevronRight size={16} />
                </Button>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                {activityFeed.map((activity, index) => {
                  const IconComponent = activity.icon;
                  return (
                    <React.Fragment key={activity.id}>
                      <Flex
                        gap={3}
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                        p={3}
                        borderRadius="md"
                        transition="all 0.2s"
                        cursor="pointer"
                      >
                        <Box color={`${activity.color}.500`} mt={1}>
                          <IconComponent size={24} />
                        </Box>
                        <Box flex="1">
                          <Text fontWeight="semibold" mb={1}>
                            {activity.title}
                          </Text>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            {activity.description}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {activity.timestamp}
                          </Text>
                        </Box>
                      </Flex>
                      {index < activityFeed.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* Active Courses */}
          <Card.Root bg={cardBg}>
            <Card.Header>
              <Flex justifyContent="space-between" alignItems="center">
                <Heading size="lg">Your Active Courses</Heading>
                <Button size="sm" variant="ghost">
                  View All
                  <IconChevronRight size={16} />
                </Button>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                {activeCourses.map((course) => (
                  <Box
                    key={course.id}
                    p={4}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    <Flex justifyContent="space-between" alignItems="center" mb={3}>
                      <Heading size="sm">{course.title}</Heading>
                      <Badge colorScheme="green">{course.progress}%</Badge>
                    </Flex>
                    <Box
                      bg={useColorModeValue('gray.100', 'gray.700')}
                      h="6px"
                      borderRadius="full"
                      mb={2}
                      overflow="hidden"
                    >
                      <Box
                        bg="green.500"
                        h="100%"
                        w={`${course.progress}%`}
                        transition="width 0.3s"
                      />
                    </Box>
                    <Flex alignItems="center" gap={2}>
                      <IconSparkles size={16} color="gray" />
                      <Text fontSize="sm" color="gray.600">
                        Next: {course.nextLesson}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </Stack>
            </Card.Body>
          </Card.Root>
        </Stack>

        {/* Right Column - Sidebar */}
        <Stack gap={6}>
          {/* Group Stewards */}
          <Card.Root bg={cardBg}>
            <Card.Header>
              <Heading size="md">Group Stewards</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={3}>
                {[
                  { id: '1', name: 'Sarah Chen' },
                  { id: '2', name: 'Marcus Johnson' },
                  { id: '3', name: 'Elena Rodriguez' },
                ].map((admin) => (
                  <Flex key={admin.id} alignItems="center" gap={3}>
                    <AvatarGroup>
                      <Avatar.Root size="sm">
                        <Avatar.Fallback>{admin.name.charAt(0)}</Avatar.Fallback>
                      </Avatar.Root>
                    </AvatarGroup>
                    <Text fontWeight="medium">{admin.name}</Text>
                  </Flex>
                ))}
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* Upcoming Events */}
          <Card.Root bg={cardBg}>
            <Card.Header>
              <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md">Upcoming Events</Heading>
                <Button size="sm" variant="ghost">
                  <IconChevronRight size={16} />
                </Button>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                {upcomingEvents.map((event) => (
                  <Box
                    key={event.id}
                    p={3}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    <Heading size="xs" mb={2}>
                      {event.title}
                    </Heading>
                    <Flex alignItems="center" gap={2} mb={2}>
                      <IconCalendar size={14} />
                      <Text fontSize="sm" color="gray.600">
                        {event.date} at {event.time}
                      </Text>
                    </Flex>
                    <Flex alignItems="center" gap={2}>
                      <IconUsers size={14} />
                      <Text fontSize="sm" color="gray.600">
                        {event.attendees} attending
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* Quick Stats */}
          <Card.Root bg={cardBg}>
            <Card.Header>
              <Heading size="md">Group Stats</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    Total Members
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {group.member_count || 234}
                  </Text>
                </Box>
                <Divider />
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    Active Courses
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    12
                  </Text>
                </Box>
                <Divider />
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    Open Discussions
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    47
                  </Text>
                </Box>
              </Stack>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Grid>
    </Stack>
  );
}
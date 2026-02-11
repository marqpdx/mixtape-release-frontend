// apps/mixtape/src/app/(authenticated)/community-hub/page.tsx

import { Box, Heading, Text, SimpleGrid, HStack, VStack, Badge, Button } from "@chakra-ui/react";

const digestCards = [
  {
    title: "Conversations",
    stats: ["New replies: 6", "Mentions: 1"],
    cta: "View Conversations",
  },
  {
    title: "Groups with activity",
    stats: ["Updated since last visit: 4"],
    cta: "View Groups",
  },
  {
    title: "Upcoming Events",
    stats: ["Next 14 days: 3"],
    cta: "View Events",
  },
  {
    title: "Admin / Steward Queue",
    stats: ["Drafts pending: 2", "Invites pending: 1"],
    cta: "View Admin Queue",
  },
];

const groupRows = [
  {
    name: "Crossroads",
    role: "Steward",
    activity: "New post",
    updatedAt: "2h ago",
    newCount: 3,
  },
  {
    name: "Library Guild",
    role: "Member",
    activity: "New reply",
    updatedAt: "5h ago",
    newCount: 1,
  },
  {
    name: "Open Studio",
    role: "Member",
    activity: "New event",
    updatedAt: "Yesterday",
    newCount: 0,
  },
];

const conversationRows = [
  {
    title: "Community Updates",
    group: "Crossroads",
    updatedAt: "1h ago",
    newCount: 2,
  },
  {
    title: "Garden Planning",
    group: "Library Guild",
    updatedAt: "3h ago",
    newCount: 1,
  },
];

const eventRows = [
  {
    title: "Weekly Gathering",
    group: "Crossroads",
    when: "Thu, 6:30 PM",
    location: "Main Hall",
  },
  {
    title: "Story Circle",
    group: "Open Studio",
    when: "Sat, 11:00 AM",
    location: "Room 2B",
  },
];

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <HStack justify="space-between" align="center" w="full">
      <Heading size="md">{title}</Heading>
      {action ? (
        <Button size="xs" variant="outline">
          {action}
        </Button>
      ) : null}
    </HStack>
  );
}

export default function CommunityHubPage() {
  return (
    <Box maxW="1100px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>
      <VStack align="stretch" gap={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Community Hub
          </Heading>
          <Text color="gray.600" _dark={{ color: "gray.300" }}>
            Show me what changed in my groups and conversations since I last checked — without
            overwhelming me.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={4}>
            Today
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
            {digestCards.map((card) => (
              <Box
                key={card.title}
                borderWidth="1px"
                borderRadius="md"
                p={4}
                bg="white"
                _dark={{ bg: "gray.900", borderColor: "gray.700" }}
              >
                <Heading size="sm" mb={2}>
                  {card.title}
                </Heading>
                <VStack align="start" gap={1} mb={3}>
                  {card.stats.map((stat) => (
                    <Text key={stat} fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
                      {stat}
                    </Text>
                  ))}
                </VStack>
                <Button size="xs" variant="outline">
                  {card.cta}
                </Button>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        <Box>
          <SectionHeader title="Groups" action="View All Groups" />
          <VStack align="stretch" gap={3} mt={3}>
            {groupRows.map((group) => (
              <HStack
                key={group.name}
                justify="space-between"
                borderWidth="1px"
                borderRadius="md"
                p={3}
                bg="white"
                _dark={{ bg: "gray.900", borderColor: "gray.700" }}
              >
                <VStack align="start" gap={1}>
                  <HStack gap={2}>
                    <Text fontWeight="semibold">{group.name}</Text>
                    <Badge size="sm" variant="subtle" colorScheme="gray">
                      {group.role}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
                    {group.activity} • {group.updatedAt}
                  </Text>
                </VStack>
                <HStack gap={2}>
                  {group.newCount > 0 ? (
                    <Badge size="sm" colorScheme="green">
                      +{group.newCount}
                    </Badge>
                  ) : null}
                  <Button size="xs" variant="outline">
                    Open Group
                  </Button>
                </HStack>
              </HStack>
            ))}
          </VStack>
        </Box>

        <Box>
          <SectionHeader title="Conversations" action="View Conversations" />
          <VStack align="stretch" gap={3} mt={3}>
            {conversationRows.map((row) => (
              <HStack
                key={row.title}
                justify="space-between"
                borderWidth="1px"
                borderRadius="md"
                p={3}
                bg="white"
                _dark={{ bg: "gray.900", borderColor: "gray.700" }}
              >
                <VStack align="start" gap={1}>
                  <Text fontWeight="semibold">{row.title}</Text>
                  <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
                    {row.group} • {row.updatedAt}
                  </Text>
                </VStack>
                {row.newCount > 0 ? (
                  <Badge size="sm" colorScheme="green">
                    +{row.newCount}
                  </Badge>
                ) : null}
              </HStack>
            ))}
          </VStack>
        </Box>

        <Box>
          <SectionHeader title="Events" action="View Events" />
          <VStack align="stretch" gap={3} mt={3}>
            {eventRows.map((row) => (
              <HStack
                key={row.title}
                justify="space-between"
                borderWidth="1px"
                borderRadius="md"
                p={3}
                bg="white"
                _dark={{ bg: "gray.900", borderColor: "gray.700" }}
              >
                <VStack align="start" gap={1}>
                  <Text fontWeight="semibold">{row.title}</Text>
                  <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
                    {row.group} • {row.when} • {row.location}
                  </Text>
                </VStack>
                <Button size="xs" variant="outline">
                  Details
                </Button>
              </HStack>
            ))}
          </VStack>
        </Box>

        <Box pt={2}>
          <Button size="xs" variant="outline">
            Manage notifications / watch levels
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}

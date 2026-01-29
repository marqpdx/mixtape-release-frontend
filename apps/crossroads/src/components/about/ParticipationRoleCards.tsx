import { Badge, Box, Heading, List, SimpleGrid, Stack, Text } from "@chakra-ui/react";

const roles = [
  {
    key: "participant",
    name: "Invited Participant",
    tagline: "Participate in a specific group you were invited to.",
    cost: "No cost",
    goodFit: [
      "You are here for one circle or project",
      "You want to join conversations and events",
      "You are not ready for a full membership",
    ],
    youCan: [
      "Join group discussions and events",
      "See group resources and updates",
      "Participate in shared work where invited",
      "Leave at any time",
    ],
    note: "Responsibility stays mostly within the group.",
  },
  {
    key: "member",
    name: "Full Crossroads Member",
    tagline: "A community-wide commitment to show up and steward.",
    cost: "Member commitment",
    goodFit: [
      "You want to belong across multiple groups",
      "You can uphold community agreements",
      "You want a longer-term home",
    ],
    youCan: [
      "Create or join circles",
      "Host gatherings and projects",
      "See member-only areas",
      "Help steward shared norms",
    ],
    note: "You take responsibility for the wider community.",
  },
  {
    key: "maker",
    name: "Crossroads Maker",
    tagline: "Build and maintain the ecosystem itself.",
    cost: "Maker commitment",
    goodFit: [
      "You want to build the platform and culture",
      "You can take on operational responsibility",
      "You have capacity to serve over time",
    ],
    youCan: [
      "Shape policies and tooling",
      "Support stewards and groups",
      "Maintain the platform and finances",
      "Guide long-term direction",
    ],
    note: "Highest stewardship and accountability.",
  },
];

export function ParticipationRoleCards() {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={{ base: 6, md: 8 }}>
      {roles.map((role) => (
        <Box
          key={role.key}
          borderWidth="1px"
          borderColor="theme.border"
          bg="theme.surface"
          borderRadius="lg"
          p={{ base: 5, md: 6 }}
          h="full"
        >
          <Stack gap={4}>
            <Stack gap={2}>
              <Heading as="h3" size="md">
                {role.name}
              </Heading>
              <Text fontSize="md" color="theme.textSecondary">
                {role.tagline}
              </Text>
              <Badge variant="outline" w="fit-content" colorScheme="gray">
                {role.cost}
              </Badge>
            </Stack>

            <Stack gap={2}>
              <Text fontWeight="600">Good fit if</Text>
              <List.Root as="ul" pl={4} gap={1}>
                {role.goodFit.map((item) => (
                  <List.Item key={item}>{item}</List.Item>
                ))}
              </List.Root>
            </Stack>

            <Stack gap={2}>
              <Text fontWeight="600">You can</Text>
              <List.Root as="ul" pl={4} gap={1}>
                {role.youCan.map((item) => (
                  <List.Item key={item}>{item}</List.Item>
                ))}
              </List.Root>
            </Stack>

            <Text fontSize="sm" color="theme.textSecondary">
              {role.note}
            </Text>
          </Stack>
        </Box>
      ))}
    </SimpleGrid>
  );
}

import { Box, Heading, Stack, Text } from "@chakra-ui/react";

const transitions = [
  {
    key: "participant-to-member",
    title: "Invited Participant to Full Member",
    gain: "Broader belonging, the ability to start circles, and access to member-wide spaces.",
    responsibility: "Uphold community agreements and contribute to shared care over time.",
  },
  {
    key: "member-to-maker",
    title: "Full Member to Crossroads Maker",
    gain: "Shared governance and a direct hand in shaping the platform and culture.",
    responsibility: "Steady operational stewardship, reliability, and transparent coordination.",
  },
];

export function ParticipationTransitionCallouts() {
  return (
    <Stack gap={4}>
      {transitions.map((transition) => (
        <Box
          key={transition.key}
          borderWidth="1px"
          borderColor="theme.border"
          borderRadius="lg"
          bg="theme.surface"
          px={{ base: 5, md: 6 }}
          py={{ base: 4, md: 5 }}
        >
          <Stack gap={2}>
            <Heading as="h3" size="sm">
              {transition.title}
            </Heading>
            <Text>
              <Text as="span" fontWeight="600">
                What you gain:{" "}
              </Text>
              {transition.gain}
            </Text>
            <Text>
              <Text as="span" fontWeight="600">
                What you take on:{" "}
              </Text>
              {transition.responsibility}
            </Text>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

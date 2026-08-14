import { Box, Heading, Text } from "@chakra-ui/react";

export const metadata = {
  title: "Catalyst · Crossroads",
  description: "Catalyst is a structured knowledge system for organizations building with intention.",
};

export default function CatalystMarketingPage() {
  return (
    <Box maxW="680px" mx="auto" px={6} py={20}>
      <Text
        fontSize="xs"
        fontWeight="600"
        letterSpacing="0.12em"
        textTransform="uppercase"
        color="gray.400"
        mb={4}
      >
        Catalyst · Crossroads
      </Text>
      <Heading as="h1" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="700" mb={4}>
        A knowledge system built for how organizations actually work.
      </Heading>
      <Text fontSize="md" color="gray.500" maxW="520px">
        More information coming soon. If you received an activation email, use the link
        provided to access your workspace directly.
      </Text>
    </Box>
  );
}

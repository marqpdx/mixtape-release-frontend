import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import CrossroadsMap from "./CrossroadsMap";

export default function Page() {
  return (
    <VStack align="stretch" gap="4" p="6">
      <Box>
        <Heading size="lg">The Crossroads</Heading>
        <Text color="rgba(0,0,0,0.65)">
          A civic map of groups and people — calm by default, layered by choice.
        </Text>
      </Box>

      <CrossroadsMap />
    </VStack>
  );
}

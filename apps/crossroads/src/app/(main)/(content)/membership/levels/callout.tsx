import NextLink from "next/link";
import { Box, Heading, HStack, Link, Stack, Text } from "@chakra-ui/react";

export function ParticipationPricingCallout() {
  return (
    <Box
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="xl"
      p={{ base: 5, md: 6 }}
      bg="theme.bgSubtle"
      maxW={"72%"}
      mx={'auto'}
    >
      <Stack gap={3}>
        <HStack justify="space-between" align="start" flexWrap="wrap" gap={2}>
          <Heading as="h3" size="sm">
            Fees (simple + transparent)
          </Heading>
        </HStack>

        <Stack gap={2}>
          <HStack display={'flex'} justify={'space-evenly'}>
            <HStack justify="space-between">
              <Text fontWeight="semibold">Crossroads Member</Text>
              <Text>$3.50 / month</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontWeight="semibold">Crossroads Maker</Text>
              <Text>$35 / month</Text>
            </HStack>
          </HStack>
        </Stack>

        <Text fontSize="sm" color="theme.textSecondary">
          Fees help cover hosting and keep stewardship sustainable. If you’re unsure, start at Member —
          you can step up later.
          <Link pl={2} as={NextLink} href="/about/pricing" textDecoration="underline" fontSize="sm">
            See full pricing
          </Link>
        </Text>
      </Stack>
    </Box>
  );
}

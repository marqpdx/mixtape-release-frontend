"use client";

import { Box, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

export function ClioWelcomeCard() {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      py={6}
      px={8}
      minH="96px"
    >
      <Text fontSize="xl" fontWeight="semibold" mb={1}>
        You&apos;re new here.
      </Text>
      <Text fontSize="sm" color={mutedColor}>
        Start an initiative, join a group, or drop a note — the surface will meet you where you are.
      </Text>
    </Box>
  );
}

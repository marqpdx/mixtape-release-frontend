"use client";

import { Box, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

export function PersonalCard() {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.400", "gray.500");

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mb={4}
    >
      <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color={mutedColor} mb={2}>
        Personal
      </Text>
      <Text fontSize="sm" color={mutedColor}>Nothing new right now.</Text>
    </Box>
  );
}

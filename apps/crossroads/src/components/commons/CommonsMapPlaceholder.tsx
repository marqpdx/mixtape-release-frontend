// components/commons/CommonsMapPlaceholder.tsx
//
// Placeholder map component for Crossroads Commons.
// Will be replaced with Leaflet + react-leaflet once dependencies are installed.

"use client";

import { Box, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

export function CommonsMapPlaceholder() {
  const bg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Box
      w="100%"
      h="100%"
      minH="400px"
      bg={bg}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack gap={2}>
        <Text fontSize="lg" color={labelColor} fontWeight="medium">
          Commons Map
        </Text>
        <Text fontSize="sm" color={labelColor}>
          Leaflet map loading here
        </Text>
      </VStack>
    </Box>
  );
}

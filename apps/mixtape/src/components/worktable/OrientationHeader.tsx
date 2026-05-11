"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { ReentryPanel } from "@components/console/ReentryPanel";
import { SignalsPanel } from "@components/console/SignalsPanel";
import { OrientationPanel } from "@components/console/OrientationPanel";

export function OrientationHeader({ collapsed, onToggle }: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const bg = useColorModeValue("gray.50", "gray.900");

  return (
    <Box
      bg={bg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      mb={4}
      overflow="hidden"
    >
      <HStack
        px={4}
        py={2}
        justify="space-between"
        borderBottom={collapsed ? "none" : "1px solid"}
        borderColor={borderColor}
        cursor="pointer"
        onClick={onToggle}
        _hover={{ opacity: 0.85 }}
      >
        <Text fontSize="xs" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="wide">
          Orientation
        </Text>
        <Text fontSize="xs" color={mutedColor}>{collapsed ? "expand ↓" : "collapse ↑"}</Text>
      </HStack>

      {!collapsed && (
        <Box px={4} py={4}>
          <Box mb={6}>
            <Text fontSize="xs" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="wide" mb={3}>
              Resume
            </Text>
            <ReentryPanel />
          </Box>
          <Box mb={6}>
            <Text fontSize="xs" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="wide" mb={3}>
              Signals
            </Text>
            <SignalsPanel />
          </Box>
          <Box>
            <Text fontSize="xs" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="wide" mb={3}>
              Working Context
            </Text>
            <OrientationPanel />
          </Box>
        </Box>
      )}
    </Box>
  );
}

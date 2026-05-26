"use client";

import { Box, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

export type StudioTab = "pulse" | "canon" | "command" | "clients";

const TABS: { key: StudioTab; label: string }[] = [
  { key: "pulse", label: "Pulse" },
  { key: "canon", label: "Canon" },
  { key: "command", label: "Command" },
];

interface GroupStudioTabsProps {
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  isSuperadmin?: boolean;
  children: React.ReactNode;
}

export function GroupStudioTabs({
  activeTab,
  onTabChange,
  isSuperadmin = false,
  children,
}: GroupStudioTabsProps) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const activeColor = useColorModeValue("blue.600", "blue.300");
  const inactiveColor = useColorModeValue("gray.500", "gray.400");

  const visibleTabs = isSuperadmin
    ? [...TABS, { key: "clients" as StudioTab, label: "Clients" }]
    : TABS;

  return (
    <Box>
      <HStack mb={6} gap={0} borderBottom="1px solid" borderColor={borderColor}>
        {visibleTabs.map((tab) => (
          <Box
            key={tab.key}
            as="button"
            px={4}
            py={2}
            fontSize="sm"
            fontWeight="medium"
            color={activeTab === tab.key ? activeColor : inactiveColor}
            borderBottom="2px solid"
            borderBottomColor={activeTab === tab.key ? activeColor : "transparent"}
            onClick={() => onTabChange(tab.key)}
            _hover={{ color: activeColor }}
            transition="color 0.15s, border-color 0.15s"
          >
            {tab.label}
          </Box>
        ))}
      </HStack>
      {children}
    </Box>
  );
}

// Placeholder content rendered in Phase 5 until Phase 6–8 tab components exist
export function StudioTabSkeleton() {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <VStack gap={4} align="stretch">
      <HStack gap={4}>
        {[1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            flex="1"
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
            p={4}
          >
            <Skeleton height="24px" mb={1} />
            <Skeleton height="12px" width="60%" />
          </Box>
        ))}
      </HStack>
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        p={5}
      >
        <Text fontWeight="semibold" mb={4}>Activity</Text>
        <VStack gap={3} align="stretch">
          <Skeleton height="36px" borderRadius="md" />
          <Skeleton height="36px" borderRadius="md" />
          <Skeleton height="36px" borderRadius="md" />
          <Skeleton height="36px" borderRadius="md" />
        </VStack>
      </Box>
    </VStack>
  );
}

"use client";

import {
  Box,
  Button,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  IconLayoutDashboard,
  IconUsers,
  IconMessageCircle,
  IconBook,
  IconUser,
} from "@tabler/icons-react";

const TABS = [
  {
    icon: <IconLayoutDashboard size={14} />,
    label: "Overview",
    description: "See what's happening — announcements, highlights, and recent activity.",
  },
  {
    icon: <IconUsers size={14} />,
    label: "Members",
    description: "Meet everyone in the group and explore their profiles.",
  },
  {
    icon: <IconMessageCircle size={14} />,
    label: "Conversations",
    description: "Participate in ongoing discussions and start new ones.",
  },
  {
    icon: <IconBook size={14} />,
    label: "Collections",
    description: "Browse resources, reading lists, and shared content.",
  },
];

interface GroupPreviewStepProps {
  groupTitle: string;
  onNext: () => void;
}

export function GroupPreviewStep({ groupTitle, onNext }: GroupPreviewStepProps) {
  return (
    <VStack gap={5} align="stretch">
      <VStack gap={1} align="start">
        <Heading size="xl" fontWeight="semibold">
          Your group home
        </Heading>
        <Text fontSize="sm" color="gray.500">
          {groupTitle}
        </Text>
      </VStack>

      <Text fontSize="sm" color="gray.600" lineHeight="tall">
        This is your group landing page. You can view who&apos;s in the group,
        participate in ongoing conversations, and browse collections.
      </Text>

      {/* Tab bar mockup */}
      <Box
        borderRadius="lg"
        border="1px solid"
        borderColor="gray.200"
        overflow="hidden"
      >
        {/* Tab row */}
        <Box bg="gray.50" borderBottom="1px solid" borderColor="gray.200" px={3} py={2}>
          <HStack justify="space-between" align="center">
            <HStack gap={1}>
              {TABS.map((tab) => (
                <HStack
                  key={tab.label}
                  gap={1}
                  px={2}
                  py={1}
                  borderRadius="md"
                  bg={tab.label === "Overview" ? "white" : "transparent"}
                  border={tab.label === "Overview" ? "1px solid" : "1px solid transparent"}
                  borderColor={tab.label === "Overview" ? "gray.200" : "transparent"}
                  fontSize="xs"
                  fontWeight={tab.label === "Overview" ? "600" : "400"}
                  color={tab.label === "Overview" ? "gray.800" : "gray.500"}
                >
                  {tab.icon}
                  <Text>{tab.label}</Text>
                </HStack>
              ))}
            </HStack>

            {/* Me button */}
            <Box
              position="relative"
              display="flex"
              alignItems="center"
              gap={1}
              px={2}
              py={1}
              borderRadius="md"
              bg="green.50"
              border="1.5px dashed"
              borderColor="green.400"
              fontSize="xs"
              fontWeight="600"
              color="green.700"
              cursor="default"
            >
              <IconUser size={12} />
              <Text>Me</Text>
              {/* Callout label */}
              <Box
                position="absolute"
                bottom="-22px"
                right={0}
                bg="green.500"
                color="white"
                fontSize="2xs"
                px={2}
                py="2px"
                borderRadius="md"
                whiteSpace="nowrap"
                fontWeight="600"
              >
                That&apos;s you →
              </Box>
            </Box>
          </HStack>
        </Box>

        {/* Tab descriptions */}
        <VStack gap={0} align="stretch" divideY="1px">
          {TABS.map((tab) => (
            <HStack key={tab.label} gap={3} px={4} py={3}>
              <Box color="gray.400" flexShrink={0}>{tab.icon}</Box>
              <VStack gap={0} align="start">
                <Text fontSize="xs" fontWeight="600" color="gray.700">{tab.label}</Text>
                <Text fontSize="xs" color="gray.500">{tab.description}</Text>
              </VStack>
            </HStack>
          ))}
        </VStack>
      </Box>

      <Text fontSize="xs" color="gray.500" lineHeight="tall">
        The <strong>Me</strong> button (far right of the tab row) takes you directly to
        your profile. From there, a <strong>Return to Group</strong> button brings you
        right back.
      </Text>

      <Button
        bg="green.500"
        color="white"
        onClick={onNext}
        _hover={{ bg: "green.600" }}
        mt={2}
      >
        Got it →
      </Button>
    </VStack>
  );
}

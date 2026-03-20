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
  IconPlant,
  IconCalendarEvent,
  IconUsers,
  IconMessageCircle,
} from "@tabler/icons-react";

interface PreviewItem {
  icon: React.ReactNode;
  label: string;
  description: string;
}

const PREVIEW_ITEMS: PreviewItem[] = [
  {
    icon: <IconPlant size={20} />,
    label: "The Feed",
    description: "See what's happening in the group",
  },
  {
    icon: <IconCalendarEvent size={20} />,
    label: "Events",
    description: "Find upcoming gatherings and sessions",
  },
  {
    icon: <IconUsers size={20} />,
    label: "Members",
    description: "Meet the people in this community",
  },
  {
    icon: <IconMessageCircle size={20} />,
    label: "Discussions",
    description: "Talk through ideas and share perspectives",
  },
];

interface GroupPreviewStepProps {
  groupTitle: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function GroupPreviewStep({
  groupTitle,
  onComplete,
  onSkip,
}: GroupPreviewStepProps) {
  return (
    <VStack gap={6} align="stretch">
      <VStack gap={1} align="start">
        <Heading size="2xl" fontWeight="semibold">
          Here&apos;s what&apos;s waiting for you
        </Heading>
        <Text fontSize="sm" color="gray.500">
          {groupTitle}
        </Text>
      </VStack>

      <VStack gap={3} align="stretch">
        {PREVIEW_ITEMS.map((item) => (
          <HStack key={item.label} gap={3} p={3} bg="gray.50" borderRadius="md">
            <Box color="green.500" flexShrink={0}>
              {item.icon}
            </Box>
            <VStack gap={0} align="start">
              <Text fontWeight="600" fontSize="sm">
                {item.label}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {item.description}
              </Text>
            </VStack>
          </HStack>
        ))}
      </VStack>

      <Text fontSize="sm" color="gray.400" textAlign="center">
        Let&apos;s go.
      </Text>

      <VStack gap={2} align="stretch">
        <Button
          bg="green.500"
          color="white"
          onClick={onComplete}
          _hover={{ bg: "green.600" }}
          size="lg"
        >
          Take me to the group →
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip} color="gray.500">
          Skip tour
        </Button>
      </VStack>
    </VStack>
  );
}

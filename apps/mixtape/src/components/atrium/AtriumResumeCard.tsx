"use client";

import { Box, Flex, Skeleton, Text } from "@chakra-ui/react";
import { IconTarget } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useColorModeValue } from "@components/ui/color-mode";
import { useRadarInitiatives } from "@mixtape/api/hooks/radar";
import { ClioWelcomeCard } from "@/components/atrium/ClioWelcomeCard";

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AtriumResumeCard() {
  const router = useRouter();
  const { data, isLoading } = useRadarInitiatives();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

  if (isLoading) {
    return (
      <Skeleton
        height="96px"
        borderRadius="md"
      />
    );
  }

  const initiative = data?.[0];
  if (!initiative) return <ClioWelcomeCard />;

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      py={6}
      px={8}
      cursor="pointer"
      onClick={() => router.push(`/radar/${initiative.id}`)}
      _hover={{ borderColor: "blue.300" }}
      transition="border-color 0.15s"
    >
      <Flex align="flex-start" gap={4}>
        <Box color="blue.500" flexShrink={0} mt={1}>
          <IconTarget size={20} />
        </Box>

        <Box flex="1" minW={0}>
          <Text
            fontSize="xl"
            fontWeight="semibold"
            lineClamp={1}
          >
            {initiative.title}
          </Text>
          <Text fontSize="sm" color={subtitleColor} mt={1}>
            Initiative
            {initiative.member_last_active_at
              ? ` · ${relativeTime(initiative.member_last_active_at)}`
              : ""}
          </Text>
          {initiative.last_session_note && (
            <Text
              fontSize="sm"
              color={subtitleColor}
              fontStyle="italic"
              mt={1}
              lineClamp={1}
            >
              {initiative.last_session_note}
            </Text>
          )}
        </Box>

        <Text fontSize="sm" color="blue.500" flexShrink={0} alignSelf="center">
          Resume →
        </Text>
      </Flex>
    </Box>
  );
}

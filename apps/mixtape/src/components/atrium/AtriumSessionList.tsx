"use client";

import { Box, Flex, Skeleton, Stack, Text } from "@chakra-ui/react";
import { IconMessageCircle } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAtriumSessions } from "@mixtape/api/hooks/atrium";
import type { AtriumSession } from "@mixtape/core/types/atriumTypes";

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

function SessionRow({ session }: { session: AtriumSession }) {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const labelColor = useColorModeValue("gray.400", "gray.500");

  const label = session.title || "Untitled session";
  const when = relativeTime(session.last_activity_at || session.created_at);

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      px={5}
      py={4}
      cursor="pointer"
      _hover={{ borderColor: "blue.300" }}
      transition="border-color 0.15s"
    >
      <Flex align="center" gap={3}>
        <Box color="blue.400" flexShrink={0}>
          <IconMessageCircle size={16} />
        </Box>
        <Box flex="1" minW={0}>
          <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
            {label}
          </Text>
          {session.entry_count > 0 && (
            <Text fontSize="xs" color={subtitleColor} mt={0.5}>
              {session.entry_count} {session.entry_count === 1 ? "exchange" : "exchanges"}
            </Text>
          )}
        </Box>
        {when && (
          <Text fontSize="xs" color={labelColor} flexShrink={0}>
            {when}
          </Text>
        )}
      </Flex>
    </Box>
  );
}

function EmptyState() {
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  return (
    <Box py={6} textAlign="center">
      <Text fontSize="sm" color={subtitleColor}>
        No sessions yet. Start a conversation below.
      </Text>
    </Box>
  );
}

export function AtriumSessionList() {
  const { sessions, isLoading } = useAtriumSessions();

  if (isLoading) {
    return (
      <Stack gap={2}>
        <Skeleton height="56px" borderRadius="md" />
        <Skeleton height="56px" borderRadius="md" />
        <Skeleton height="56px" borderRadius="md" />
      </Stack>
    );
  }

  if (!sessions.length) return <EmptyState />;

  return (
    <Stack gap={2}>
      {sessions.map((s) => (
        <SessionRow key={s.id} session={s} />
      ))}
    </Stack>
  );
}

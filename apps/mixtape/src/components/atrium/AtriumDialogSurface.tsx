"use client";

import { useState } from "react";
import { Box, Button, Flex, Skeleton, Stack, Text } from "@chakra-ui/react";
import { IconPlus } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  useAtriumSessions,
  useCreateAtriumSession,
  useAtriumExchange,
} from "@mixtape/api/hooks/atrium";
import type { AtriumSession } from "@mixtape/core/types/atriumTypes";
import { AtriumSessionThread } from "./AtriumSessionThread";
import { AtriumComposeBar } from "./AtriumComposeBar";

export function AtriumDialogSurface() {
  const { sessions, isLoading } = useAtriumSessions();
  const { mutateAsync: createSession, isPending: creating } = useCreateAtriumSession();
  const [activeSession, setActiveSession] = useState<AtriumSession | null>(null);

  const { entries, streaming, error, send, reset } = useAtriumExchange(activeSession);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

  async function handleNewSession() {
    const session = await createSession({});
    reset();
    setActiveSession(session);
  }

  function handleSelectSession(session: AtriumSession) {
    if (session.id === activeSession?.id) return;
    reset();
    setActiveSession(session);
  }

  if (isLoading) {
    return (
      <Stack gap={2}>
        <Skeleton height="48px" borderRadius="md" />
        <Skeleton height="48px" borderRadius="md" />
      </Stack>
    );
  }

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
    >
      {/* Session picker + new session */}
      <Flex
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        align="center"
        gap={3}
        overflowX="auto"
      >
        {sessions.length === 0 && !activeSession && (
          <Text fontSize="sm" color={subtitleColor} flexShrink={0}>
            No sessions yet.
          </Text>
        )}
        {sessions.map((s) => (
          <Button
            key={s.id}
            size="xs"
            variant={activeSession?.id === s.id ? "solid" : "outline"}
            colorScheme="blue"
            onClick={() => handleSelectSession(s)}
            flexShrink={0}
            maxW="160px"
          >
            <Text lineClamp={1}>{s.title || "Untitled"}</Text>
          </Button>
        ))}
        <Button
          size="xs"
          variant="ghost"
          onClick={handleNewSession}
          loading={creating}
          flexShrink={0}
          ml="auto"
        >
          <IconPlus size={14} />
          New
        </Button>
      </Flex>

      {/* Thread */}
      {activeSession ? (
        <Box px={4} pt={4}>
          <AtriumSessionThread entries={entries} streaming={streaming} error={error} />
        </Box>
      ) : (
        <Box px={4} pt={6} pb={2} textAlign="center">
          <Text fontSize="sm" color={subtitleColor}>
            Select a session above or start a new one.
          </Text>
        </Box>
      )}

      {/* Compose bar */}
      <Box px={4} pb={4} pt={3}>
        <AtriumComposeBar
          onSend={send}
          disabled={!activeSession}
          streaming={streaming}
        />
      </Box>
    </Box>
  );
}

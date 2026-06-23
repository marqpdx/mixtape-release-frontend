"use client";

import { useEffect, useRef } from "react";
import { Box, Stack, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { ExchangeEntry } from "@mixtape/api/hooks/atrium";

interface AtriumSessionThreadProps {
  entries: ExchangeEntry[];
  streaming: boolean;
  error: string | null;
}

function EntryBubble({ entry }: { entry: ExchangeEntry }) {
  const isUser = entry.role === "user";
  const userBg = useColorModeValue("blue.500", "blue.600");
  const assistantBg = useColorModeValue("gray.100", "gray.700");
  const userText = "white";
  const assistantText = useColorModeValue("gray.800", "gray.100");

  return (
    <Box
      alignSelf={isUser ? "flex-end" : "flex-start"}
      maxW="85%"
      bg={isUser ? userBg : assistantBg}
      color={isUser ? userText : assistantText}
      px={4}
      py={3}
      borderRadius={isUser ? "lg lg sm lg" : "lg lg lg sm"}
    >
      <Text fontSize="sm" whiteSpace="pre-wrap">
        {entry.content}
      </Text>
    </Box>
  );
}

export function AtriumSessionThread({ entries, streaming, error }: AtriumSessionThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const errorColor = useColorModeValue("red.500", "red.400");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, streaming]);

  if (!entries.length && !error) return null;

  return (
    <Box
      maxH="480px"
      overflowY="auto"
      px={1}
      pb={2}
    >
      <Stack gap={3} direction="column">
        {entries.map((e, i) => (
          <EntryBubble key={i} entry={e} />
        ))}
        {error && (
          <Text fontSize="sm" color={errorColor} px={1}>
            {error}
          </Text>
        )}
      </Stack>
      <div ref={bottomRef} />
    </Box>
  );
}

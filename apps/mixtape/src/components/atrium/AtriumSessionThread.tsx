"use client";

import { useEffect, useRef, useState } from "react";
import { Box, IconButton, Stack, Text } from "@chakra-ui/react";
import { IconCheck, IconFileText } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCreateMillDraft } from "@mixtape/api/hooks/workbench";
import { toaster } from "@mixtape/core/lib/toaster";
import type { ExchangeEntry } from "@mixtape/api/hooks/atrium";

interface AtriumSessionThreadProps {
  entries: ExchangeEntry[];
  streaming: boolean;
  error: string | null;
  sessionTitle?: string;
}

function EntryBubble({ entry, sessionTitle }: { entry: ExchangeEntry; sessionTitle?: string }) {
  const isUser = entry.role === "user";
  const userBg = useColorModeValue("blue.500", "blue.600");
  const assistantBg = useColorModeValue("gray.100", "gray.700");
  const userText = "white";
  const assistantText = useColorModeValue("gray.800", "gray.100");
  const actionColor = useColorModeValue("gray.400", "gray.500");

  const { user } = useAuth();
  const { mutateAsync: createDraft, isPending } = useCreateMillDraft();
  const [promoted, setPromoted] = useState(false);

  async function handlePromote() {
    if (!user) return;
    try {
      await createDraft({
        sponsor_type: "user",
        sponsor_id: user.id,
        content_profile: "note",
        title: sessionTitle || "Atrium note",
        grist_body: entry.content,
        source_type: "atrium",
        source_id: entry.id ?? "",
      });
      setPromoted(true);
      toaster.create({
        title: "Saved to drafts",
        description: "Find it in your Workbench to continue shaping it.",
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      toaster.create({
        title: "Failed to save draft",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
        duration: 4000,
      });
    }
  }

  return (
    <Box
      alignSelf={isUser ? "flex-end" : "flex-start"}
      maxW="85%"
      position="relative"
    >
      <Box
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
      {!isUser && entry.content && (
        <IconButton
          aria-label={promoted ? "Saved to drafts" : "Save as draft"}
          size="2xs"
          variant="ghost"
          mt={1}
          color={promoted ? "green.500" : actionColor}
          onClick={handlePromote}
          loading={isPending}
          disabled={promoted}
        >
          {promoted ? <IconCheck size={12} /> : <IconFileText size={12} />}
        </IconButton>
      )}
    </Box>
  );
}

export function AtriumSessionThread({ entries, streaming, error, sessionTitle }: AtriumSessionThreadProps) {
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
          <EntryBubble key={e.id ?? i} entry={e} sessionTitle={sessionTitle} />
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

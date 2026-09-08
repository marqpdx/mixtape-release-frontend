"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, IconButton, Stack, Text } from "@chakra-ui/react";
import { IconArrowDown, IconArrowUp, IconCheck, IconFileText } from "@tabler/icons-react";
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
  const userBg = "var(--theme-accent-soft)";
  const assistantBg = useColorModeValue("gray.100", "gray.700");
  const userText = "var(--theme-text)";
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
    <Box alignSelf={isUser ? "flex-end" : "flex-start"} maxW="85%" position="relative">
      <Box
        bg={isUser ? userBg : assistantBg}
        color={isUser ? userText : assistantText}
        px={4}
        py={3}
        borderRadius={isUser ? "lg lg sm lg" : "lg lg lg sm"}
      >
        <Text fontSize="md" whiteSpace="pre-wrap">
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
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const errorColor = useColorModeValue("red.500", "red.400");
  const scrollBtnColor = useColorModeValue("gray.400", "gray.500");
  const userScrolledUp = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function onScroll() {
      const el = containerRef.current;
      if (!el) return;
      userScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
    }
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll to bottom when new entries arrive (unless user scrolled up)
  useEffect(() => {
    if (!userScrolledUp.current) {
      const el = containerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [entries, streaming]);

  // Scroll to bottom on initial mount
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  if (!entries.length && !error) return null;

  return (
    <Box flex="1" minH="0" display="flex" flexDirection="column" position="relative">
      <Box ref={containerRef} flex="1" minH="0" overflowY="auto" px={1} pb={2}>
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

      {/* Scroll nav buttons */}
      <Flex
        position="absolute"
        right={2}
        bottom={3}
        flexDirection="column"
        gap={1}
        zIndex={5}
        opacity={0.5}
        _hover={{ opacity: 1 }}
        transition="opacity 0.15s"
      >
        <IconButton
          aria-label="Scroll to top"
          size="2xs"
          variant="ghost"
          color={scrollBtnColor}
          onClick={() => { if (containerRef.current) containerRef.current.scrollTop = 0; }}
        >
          <IconArrowUp size={11} />
        </IconButton>
        <IconButton
          aria-label="Scroll to bottom"
          size="2xs"
          variant="ghost"
          color={scrollBtnColor}
          onClick={() => { if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight; }}
        >
          <IconArrowDown size={11} />
        </IconButton>
      </Flex>
    </Box>
  );
}

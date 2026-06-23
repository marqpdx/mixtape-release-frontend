"use client";

import { useEffect, useState } from "react";
import { Box, Button, Flex, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useUpdateAtriumSession } from "@mixtape/api/hooks/atrium";
import type { AtriumSession } from "@mixtape/core/types/atriumTypes";

interface AtriumMemorySeedEditorProps {
  session: AtriumSession;
  onSaved: (updated: AtriumSession) => void;
  onCancel: () => void;
}

export function AtriumMemorySeedEditor({ session, onSaved, onCancel }: AtriumMemorySeedEditorProps) {
  const [title, setTitle] = useState(session.title);
  const [context, setContext] = useState(session.session_context);
  const { mutateAsync: updateSession, isPending } = useUpdateAtriumSession();

  const bgColor = useColorModeValue("gray.50", "gray.850");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const hintColor = useColorModeValue("gray.400", "gray.500");

  // Sync only when session identity changes — intentionally omits field deps
  // so in-progress edits aren't clobbered by re-renders.
  useEffect(() => {
    setTitle(session.title);
    setContext(session.session_context);
  }, [session.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = title !== session.title || context !== session.session_context;

  async function handleSave() {
    const updated = await updateSession({
      sessionId: session.id,
      data: { title, session_context: context },
    });
    onSaved(updated);
  }

  return (
    <Box
      bg={bgColor}
      borderTopWidth="1px"
      borderColor={borderColor}
      px={4}
      py={4}
    >
      <Stack gap={4}>
        <Stack gap={1}>
          <Text fontSize="xs" fontWeight="medium" color={labelColor} textTransform="uppercase" letterSpacing="wide">
            Session title
          </Text>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            size="sm"
            disabled={isPending}
          />
        </Stack>

        <Stack gap={1}>
          <Text fontSize="xs" fontWeight="medium" color={labelColor} textTransform="uppercase" letterSpacing="wide">
            Memory seed
          </Text>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Standing context for this session — your role, the project state, working principles, or anything Claude should know at the start of each exchange."
            rows={5}
            fontSize="sm"
            disabled={isPending}
            resize="vertical"
          />
          <Text fontSize="xs" color={hintColor}>
            This seeds every exchange in this session. Equivalent to a CLAUDE.md for the conversation.
          </Text>
        </Stack>

        <Flex gap={3} justify="flex-end">
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={handleSave}
            loading={isPending}
            disabled={!isDirty || isPending}
          >
            Save
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Box, Button, Flex, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useInitiativeMemory, useUpdateDialogue, useUpdateInitiativeMemory } from "@mixtape/api/hooks/atrium";
import type { Dialogue } from "@mixtape/core/types/atriumTypes";

interface AtriumMemorySeedEditorProps {
  session: Dialogue;
  onSaved: (updated: Dialogue) => void;
  onCancel: () => void;
}

export function AtriumMemorySeedEditor({ session, onSaved, onCancel }: AtriumMemorySeedEditorProps) {
  const [title, setTitle] = useState(session.title);
  // The memory belongs to the Dialogue's Initiative (CTO, 2026-11-04): every Dialogue in it opens with it.
  const { memory: initiativeMemory } = useInitiativeMemory(session.id);
  const savedMemory = initiativeMemory?.memory ?? "";
  const [context, setContext] = useState(savedMemory);
  const { mutateAsync: updateSession, isPending: savingTitle } = useUpdateDialogue();
  const { mutateAsync: updateMemory, isPending: savingMemory } = useUpdateInitiativeMemory();
  const isPending = savingTitle || savingMemory;
  const initiativeName = initiativeMemory
    ? initiativeMemory.initiative_is_personal ? "Personal" : initiativeMemory.initiative_title
    : null;

  const bgColor = useColorModeValue("gray.50", "gray.850");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const hintColor = useColorModeValue("gray.400", "gray.500");

  // Sync only when session identity changes — intentionally omits field deps
  // so in-progress edits aren't clobbered by re-renders.
  useEffect(() => {
    setTitle(session.title);
  }, [session.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setContext(savedMemory);
  }, [savedMemory]);

  const isDirty = title !== session.title || (!!initiativeMemory && context !== savedMemory);

  async function handleSave() {
    if (initiativeMemory && context !== savedMemory) {
      await updateMemory({ dialogueId: session.id, memory: context });
    }
    const updated = title !== session.title
      ? await updateSession({ sessionId: session.id, data: { title } })
      : session;
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
            Dialogue title
          </Text>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Dialogue title"
            placeholder="Untitled"
            size="sm"
            disabled={isPending}
          />
        </Stack>

        <Stack gap={1}>
          <Text fontSize="xs" fontWeight="medium" color={labelColor} textTransform="uppercase" letterSpacing="wide">
            {initiativeName ? `Memory — ${initiativeName}` : "Memory"}
          </Text>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            aria-label="Initiative memory"
            placeholder="What matters for this work: your role, decisions made, where it stands, working principles. Agents read it at the start of every Dialogue here."
            rows={5}
            fontSize="sm"
            disabled={isPending || !initiativeMemory}
            resize="vertical"
          />
          <Text fontSize="xs" color={hintColor}>
            {initiativeMemory
              ? `Every Dialogue in ${initiativeName} starts with this.`
              : "This Dialogue has no Initiative to keep a memory in."}
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

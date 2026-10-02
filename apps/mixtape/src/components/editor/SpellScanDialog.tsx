// apps/mixtape/src/components/editor/SpellScanDialog.tsx
//
// Sequential spell-check dialog over the current dictionary-backed scan.
//
// "Fix & Remember" adds the pair to the user's personal corrections (persisted
// to the backend), so inline autocorrect will catch it on future keystrokes.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, HStack, IconButton, Input, Text, VStack } from "@chakra-ui/react";
import { IconTextSpellcheck, IconX } from "@tabler/icons-react";
import { Editor } from "@tiptap/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { SpellFinding } from "@/lib/spell/scan";

// ─── scan utilities ──────────────────────────────────────────────────────────

// ─── component ───────────────────────────────────────────────────────────────

interface SpellScanDialogProps {
  editor: Editor;
  addReplacement: (wrong: string, correct: string) => void;
  addIgnore: (word: string) => void;
  findings: SpellFinding[];
  scanStatus: "loading" | "ready" | "error";
  onRescan: () => void;
  onClose: () => void;
}

export function SpellScanDialog({ editor, addReplacement, addIgnore, findings, scanStatus, onRescan, onClose }: SpellScanDialogProps) {
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(() => new Set());
  const [idx, setIdx] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const matches = useMemo(() => findings.filter((finding) => !skipped.has(finding.text.toLowerCase())), [findings, skipped]);
  const isDone = scanStatus === "ready" && idx >= matches.length;

  const panelBg = useColorModeValue("white", "gray.800");
  const contextBg = useColorModeValue("gray.50", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    if (scanStatus !== "ready") return;
    setIdx(0);
  }, [findings, scanStatus]);

  const current = scanStatus === "ready" && !isDone ? matches[idx] : null;
  useEffect(() => {
    setSuggestion(current?.suggestions[0] ?? "");
    if (current) editor.commands.setTextSelection({ from: current.from, to: current.to });
  }, [current, editor]);

  const context = useMemo(() => {
    if (!current) return null;
    const doc = editor.state.doc;
    const before = doc.textBetween(Math.max(0, current.from - 50), current.from, " ").trimStart();
    const after = doc.textBetween(current.to, Math.min(doc.content.size, current.to + 50), " ").trimEnd();
    return { before, after };
  }, [current, editor]);

  const handleFix = useCallback(() => {
    if (!current || !suggestion.trim()) return;
    editor.chain().focus()
      .setTextSelection({ from: current.from, to: current.to })
      .insertContent(suggestion.trim())
      .run();
    onRescan();
  }, [current, suggestion, editor, onRescan]);

  const handleFixAndRemember = useCallback(() => {
    if (!current) return;
    if (!suggestion.trim()) return;
    addReplacement(current.text, suggestion.trim());
    handleFix();
  }, [current, suggestion, addReplacement, handleFix]);

  const handleSkip = useCallback(() => {
    if (!current) return;
    const next = idx + 1;
    setIdx(next);
    if (next >= matches.length) {
      editor.commands.focus();
    } else {
      editor.commands.setTextSelection({ from: matches[next].from, to: matches[next].to });
    }
  }, [current, idx, matches, editor]);

  const handleSkipAll = useCallback(() => {
    if (!current) return;
    setSkipped((previous) => new Set(previous).add(current.text.toLowerCase()));
    setIdx(idx >= matches.length - 1 ? matches.length : idx);
  }, [current, idx, matches]);

  const handleAddWord = useCallback(() => {
    if (!current) return;
    addIgnore(current.text);
    setSkipped((previous) => new Set(previous).add(current.text.toLowerCase()));
    setIdx(idx >= matches.length - 1 ? matches.length : idx);
  }, [current, addIgnore, idx, matches]);

  const handleDone = useCallback(() => {
    editor.commands.focus();
    onClose();
  }, [editor, onClose]);

  return (
    <Box
      position="fixed"
      bottom={6}
      right={6}
      zIndex={9990}
      bg={panelBg}
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      boxShadow="xl"
      w="380px"
      p={4}
    >
      {/* Header */}
      <HStack justify="space-between" mb={3}>
        <HStack gap={2}>
          <IconTextSpellcheck size={16} />
          <Text fontWeight="semibold" fontSize="sm">Check Spelling</Text>
          {scanStatus === "ready" && !isDone && matches.length > 0 && (
            <Text fontSize="xs" color={mutedColor}>{idx + 1} of {matches.length}</Text>
          )}
        </HStack>
        <IconButton aria-label="Close spell check" size="xs" variant="ghost" onClick={handleDone}>
          <IconX size={14} />
        </IconButton>
      </HStack>

      {scanStatus !== "ready" || isDone || !current ? (
        <VStack gap={3} align="stretch">
          <Text fontSize="sm" color={mutedColor} textAlign="center" py={2}>
            {scanStatus === "loading" ? "Checking spelling..." : scanStatus === "error" ? "Spell check unavailable. Try again later." : matches.length === 0 ? "No spelling findings." : "Spell check complete."}
          </Text>
          <Button size="sm" variant="outline" onClick={handleDone}>Close</Button>
        </VStack>
      ) : (
        <VStack gap={3} align="stretch">
          {/* Context strip */}
          <Box bg={contextBg} px={3} py={2} borderRadius="md" fontSize="sm" lineHeight="1.7">
            <Text as="span" color={mutedColor}>{context?.before}</Text>
            {context?.before && " "}
            <Text
              as="span"
              bg="yellow.200"
              color="yellow.900"
              px="2px"
              borderRadius="sm"
              fontWeight="semibold"
              _dark={{ bg: "yellow.700", color: "yellow.100" }}
            >
              {current.text}
            </Text>
            {context?.after && " "}
            <Text as="span" color={mutedColor}>{context?.after}</Text>
          </Box>

          {/* Found / suggestion */}
          <HStack gap={4} px={1}>
            <VStack align="start" gap={0} flex={1}>
              <Text fontSize="10px" color={mutedColor} fontWeight="medium" letterSpacing="wide" textTransform="uppercase">Found</Text>
              <Text fontFamily="mono" fontSize="sm" color="red.500">{current.text}</Text>
            </VStack>
            <Text color={mutedColor} fontSize="sm">→</Text>
            <VStack align="start" gap={0} flex={1}>
              <Text fontSize="10px" color={mutedColor} fontWeight="medium" letterSpacing="wide" textTransform="uppercase">Suggestion</Text>
              <Input value={suggestion} onChange={(event) => setSuggestion(event.target.value)} size="sm" aria-label="Spelling replacement" />
            </VStack>
          </HStack>

          {/* Action buttons */}
          <VStack gap={2} align="stretch">
            <HStack gap={2}>
              <Button size="sm" colorPalette="blue" flex={1} onClick={handleFix} disabled={!suggestion.trim()}>
                Fix
              </Button>
              <Button size="sm" colorPalette="teal" flex={1} onClick={handleFixAndRemember} disabled={!suggestion.trim()}>
                Fix & Remember
              </Button>
            </HStack>
            <HStack gap={2}>
              <Button size="sm" variant="outline" flex={1} onClick={handleSkip}>
                Skip
              </Button>
              <Button size="sm" variant="outline" flex={1} onClick={handleSkipAll}>
                Skip All
              </Button>
            </HStack>
            <Button size="sm" variant="outline" onClick={handleAddWord}>Add to my dictionary</Button>
            <Button size="sm" variant="ghost" onClick={handleDone} color={mutedColor}>
              Done
            </Button>
          </VStack>
        </VStack>
      )}
    </Box>
  );
}

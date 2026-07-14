// apps/mixtape/src/components/editor/SpellScanDialog.tsx
//
// Sequential spell-check dialog — walks the doc top-to-bottom, surfacing each
// match one at a time with Fix / Fix & Remember / Skip / Skip All / Done.
//
// "Fix & Remember" adds the pair to the user's personal corrections (persisted
// to the backend), so inline autocorrect will catch it on future keystrokes.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { IconTextSpellcheck, IconX } from "@tabler/icons-react";
import { Editor } from "@tiptap/react";
import { useColorModeValue } from "@components/ui/color-mode";

// ─── scan utilities ──────────────────────────────────────────────────────────

type ScanMatch = {
  text: string;
  from: number;
  to: number;
  suggestion: string;
};

// Matches standard words AND slash-joined shorthands (b/c, w/, and/or).
// The trailing `(?:\/[A-Za-zÀ-ɏ]*)*` extends through slashes only
// when followed by more word chars or at end (handles "w/" → trailing slash ok).
const TOKEN_RE = /[A-Za-zÀ-ɏ]+(?:\/[A-Za-zÀ-ɏ]*)*/g;

function scanDoc(
  editor: Editor,
  getCorrection: (w: string) => string | null,
  skipSet: ReadonlySet<string>,
): ScanMatch[] {
  const out: ScanMatch[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    TOKEN_RE.lastIndex = 0;
    let m;
    while ((m = TOKEN_RE.exec(node.text)) !== null) {
      const word = m[0];
      if (skipSet.has(word.toLowerCase())) continue;
      const suggestion = getCorrection(word);
      if (suggestion && suggestion !== word) {
        out.push({ text: word, from: pos + m.index, to: pos + m.index + word.length, suggestion });
      }
    }
  });
  return out;
}

// ─── component ───────────────────────────────────────────────────────────────

interface SpellScanDialogProps {
  editor: Editor;
  getCorrection: (w: string) => string | null;
  addReplacement: (wrong: string, correct: string) => void;
  onClose: () => void;
}

export function SpellScanDialog({ editor, getCorrection, addReplacement, onClose }: SpellScanDialogProps) {
  const skipRef = useRef(new Set<string>());
  const [matches, setMatches] = useState<ScanMatch[]>([]);
  const [idx, setIdx] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const panelBg = useColorModeValue("white", "gray.800");
  const contextBg = useColorModeValue("gray.50", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  // Scan and find the first match at or after `keepFrom` in the current doc.
  const doScan = useCallback((keepFrom = 0) => {
    const found = scanDoc(editor, getCorrection, skipRef.current);
    setMatches(found);
    const ni = found.findIndex(m => m.from >= keepFrom);
    const next = ni === -1 ? found.length : ni;
    setIdx(next);
    if (next >= found.length) {
      setIsDone(true);
    } else {
      setIsDone(false);
      editor.commands.setTextSelection({ from: found[next].from, to: found[next].to });
    }
    return { found, next };
  }, [editor, getCorrection]);

  // Initial scan on open — run exactly once.
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    doScan(0);
  }, [doScan]);

  const current = !isDone && idx < matches.length ? matches[idx] : null;

  const context = useMemo(() => {
    if (!current) return null;
    const doc = editor.state.doc;
    const before = doc.textBetween(Math.max(0, current.from - 50), current.from, " ").trimStart();
    const after = doc.textBetween(current.to, Math.min(doc.content.size, current.to + 50), " ").trimEnd();
    return { before, after };
  }, [current, editor]);

  const handleFix = useCallback(() => {
    if (!current) return;
    const fixedEnd = current.from + current.suggestion.length;
    editor.chain().focus()
      .setTextSelection({ from: current.from, to: current.to })
      .insertContent(current.suggestion)
      .run();
    doScan(fixedEnd);
  }, [current, editor, doScan]);

  const handleFixAndRemember = useCallback(() => {
    if (!current) return;
    addReplacement(current.text, current.suggestion);
    handleFix();
  }, [current, addReplacement, handleFix]);

  const handleSkip = useCallback(() => {
    if (!current) return;
    const next = idx + 1;
    setIdx(next);
    if (next >= matches.length) {
      setIsDone(true);
      editor.commands.focus();
    } else {
      editor.commands.setTextSelection({ from: matches[next].from, to: matches[next].to });
    }
  }, [current, idx, matches, editor]);

  const handleSkipAll = useCallback(() => {
    if (!current) return;
    skipRef.current.add(current.text.toLowerCase());
    doScan(current.from);
  }, [current, doScan]);

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
          {!isDone && matches.length > 0 && (
            <Text fontSize="xs" color={mutedColor}>{idx + 1} of {matches.length}</Text>
          )}
        </HStack>
        <IconButton aria-label="Close spell check" size="xs" variant="ghost" onClick={handleDone}>
          <IconX size={14} />
        </IconButton>
      </HStack>

      {isDone || !current ? (
        <VStack gap={3} align="stretch">
          <Text fontSize="sm" color={mutedColor} textAlign="center" py={2}>
            {matches.length === 0 && idx === 0 ? "No suggestions found." : "Spell check complete."}
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
              <Text fontFamily="mono" fontSize="sm" color="green.600" _dark={{ color: "green.400" }}>{current.suggestion}</Text>
            </VStack>
          </HStack>

          {/* Action buttons */}
          <VStack gap={2} align="stretch">
            <HStack gap={2}>
              <Button size="sm" colorPalette="blue" flex={1} onClick={handleFix}>
                Fix
              </Button>
              <Button size="sm" colorPalette="teal" flex={1} onClick={handleFixAndRemember}>
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
            <Button size="sm" variant="ghost" onClick={handleDone} color={mutedColor}>
              Done
            </Button>
          </VStack>
        </VStack>
      )}
    </Box>
  );
}

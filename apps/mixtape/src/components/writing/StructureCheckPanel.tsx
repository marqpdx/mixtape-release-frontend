"use client";

/**
 * StructureCheckPanel — non-destructive TipTap document structure analyzer.
 *
 * Shows: node-type distribution, heading hierarchy, word count, structural issues.
 * "Create repaired copy" removes empty headings, applies sequential level
 * normalization (no jump > 1 level), trims boundary empty paragraphs, then
 * creates a new draft. Word count is verified so no content is silently lost.
 */

import { useState, useMemo, useCallback } from "react";
import { JSONContent } from "@tiptap/react";
import {
  Box,
  Button,
  Checkbox,
  HStack,
  Heading,
  Spinner,
  Text,
  VStack,
  Badge,
  Separator,
  Table,
} from "@chakra-ui/react";
import {
  IconAlertTriangle,
  IconCheck,
  IconCircleX,
  IconX,
} from "@tabler/icons-react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import type { DualPanelSponsor } from "./dual-panel/DualPanelEditorWorkArea";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeadingEntry {
  level: number;
  text: string;
  empty: boolean;
}

interface StructureAnalysis {
  nodeCount: number;
  nodeTypes: Record<string, number>;
  wordCount: number;
  charCount: number;
  headings: HeadingEntry[];
  emptyParagraphCount: number;
  issues: string[];
}

interface StructureCheckPanelProps {
  bodyJson: JSONContent;
  title: string;
  pieceId: string;
  sponsor: DualPanelSponsor;
  onClose: () => void;
}

// ─── Analysis helpers ─────────────────────────────────────────────────────────

function extractNodeText(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(extractNodeText).join("");
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function analyzeDoc(doc: JSONContent): StructureAnalysis {
  const nodeTypes: Record<string, number> = {};
  const headings: HeadingEntry[] = [];
  let nodeCount = 0;
  let wordCount = 0;
  let charCount = 0;
  let emptyParagraphCount = 0;
  const issues: string[] = [];

  function walk(node: JSONContent) {
    nodeCount++;
    const type = node.type ?? "unknown";
    nodeTypes[type] = (nodeTypes[type] ?? 0) + 1;

    if (type === "text") {
      const t = node.text ?? "";
      charCount += t.length;
      wordCount += countWords(t);
    }

    if (type === "heading") {
      const level = (node.attrs?.level as number) ?? 1;
      const text = extractNodeText(node);
      const empty = !text.trim();
      headings.push({ level, text, empty });
      if (empty) issues.push(`Empty H${level} heading`);
    }

    if (type === "paragraph") {
      const text = extractNodeText(node).trim();
      if (!text) emptyParagraphCount++;
    }

    for (const child of node.content ?? []) walk(child);
  }

  walk(doc);

  // Check heading level jumps
  let prevLevel = 0;
  for (const h of headings) {
    if (prevLevel > 0 && h.level > prevLevel + 1) {
      const preview = h.text.slice(0, 40) + (h.text.length > 40 ? "…" : "");
      issues.push(`Heading jump H${prevLevel}→H${h.level}: "${preview}"`);
    }
    prevLevel = h.level;
  }

  if (emptyParagraphCount > 5) {
    issues.push(`${emptyParagraphCount} empty paragraphs (may be import artifacts)`);
  }

  return { nodeCount, nodeTypes, wordCount, charCount, headings, emptyParagraphCount, issues };
}

// ─── Repair helpers ───────────────────────────────────────────────────────────

function isEmptyParagraph(node: JSONContent): boolean {
  return node.type === "paragraph" && !extractNodeText(node).trim();
}

function repairDoc(doc: JSONContent, opts: { removeEmptyParas?: boolean } = {}): JSONContent {
  const topContent = doc.content ?? [];

  // Remove empty headings (no text content — common Word/Markdown import artifact).
  const withoutEmptyHeadings = topContent.filter(
    (n) => !(n.type === "heading" && !extractNodeText(n).trim())
  );

  // Sequential level normalization: walk headings in document order.
  // A heading may go up any number of levels but can only go ONE level deeper
  // than the previous heading. First heading is always normalized to H1.
  let prevLevel = 0;
  const normalized = withoutEmptyHeadings.map((node) => {
    if (node.type === "heading") {
      const orig = (node.attrs?.level as number) ?? 1;
      const newLevel =
        prevLevel === 0
          ? 1
          : orig <= prevLevel
          ? orig
          : Math.min(orig, prevLevel + 1);
      prevLevel = newLevel;
      return { ...node, attrs: { ...node.attrs, level: newLevel } };
    }
    return node;
  });

  // Remove all empty paragraphs, or just trim boundary ones.
  let processed: JSONContent[];
  if (opts.removeEmptyParas) {
    processed = normalized.filter((n) => !isEmptyParagraph(n));
  } else {
    processed = normalized;
    while (processed.length > 0 && isEmptyParagraph(processed[0])) {
      processed = processed.slice(1);
    }
    while (processed.length > 0 && isEmptyParagraph(processed[processed.length - 1])) {
      processed = processed.slice(0, -1);
    }
  }

  return { ...doc, content: processed };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StructureCheckPanel({
  bodyJson,
  title,
  sponsor,
  onClose,
}: StructureCheckPanelProps) {
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{ pieceId: string; title: string } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [removeEmptyParas, setRemoveEmptyParas] = useState(false);

  const analysis = useMemo(() => analyzeDoc(bodyJson), [bodyJson]);
  const repairedDoc = useMemo(() => repairDoc(bodyJson, { removeEmptyParas }), [bodyJson, removeEmptyParas]);
  const repairedAnalysis = useMemo(() => analyzeDoc(repairedDoc), [repairedDoc]);

  const wordCountMatch = analysis.wordCount === repairedAnalysis.wordCount;

  const handleCreateRepaired = useCallback(async () => {
    if (!sponsor.id) {
      setCreateError("Sponsor ID is required to create a new draft. Re-open via the group admin panel.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await axiosInstance.post("/api/writing/pieces", {
        title: `${title} (repaired)`,
        body_json: repairedDoc,
        status: "draft",
        sponsor_content_type: sponsor.type,
        sponsor_object_id: sponsor.id,
        create_working_copy: true,
        writing_kind: "article",
      });
      setCreateResult({ pieceId: res.data.id as string, title: res.data.title as string });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create repaired copy";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  }, [sponsor, title, repairedDoc]);

  const topNodeTypes = Object.entries(analysis.nodeTypes)
    .filter(([t]) => t !== "doc")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <Box
      position="fixed"
      top={0}
      right={0}
      bottom={0}
      w="420px"
      bg="bg.canvas"
      borderLeftWidth="1px"
      borderColor="border.muted"
      zIndex={100}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      boxShadow="xl"
    >
      {/* Header */}
      <HStack
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor="border.muted"
        bg="bg.subtle"
        justify="space-between"
        flexShrink={0}
      >
        <VStack align="start" gap={0}>
          <Heading size="sm">Structure Check</Heading>
          <Text fontSize="xs" color="fg.muted" lineClamp={1} maxW="300px">
            {title}
          </Text>
        </VStack>
        <Button size="xs" variant="ghost" onClick={onClose} aria-label="Close">
          <IconX size={14} />
        </Button>
      </HStack>

      {/* Body */}
      <Box flex={1} overflowY="auto" p={4}>
        <VStack align="stretch" gap={4}>

          {/* Summary stats */}
          <Box>
            <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color="fg.muted" mb={2}>
              Document stats
            </Text>
            <HStack gap={4} flexWrap="wrap">
              <StatPill label="Words" value={analysis.wordCount} />
              <StatPill label="Chars" value={analysis.charCount} />
              <StatPill label="Headings" value={analysis.headings.length} />
              <StatPill label="Empty ¶" value={analysis.emptyParagraphCount} warn={analysis.emptyParagraphCount > 5} />
            </HStack>
          </Box>

          {/* Node type distribution */}
          <Box>
            <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color="fg.muted" mb={2}>
              Node types
            </Text>
            <Table.Root size="sm">
              <Table.Body>
                {topNodeTypes.map(([type, count]) => (
                  <Table.Row key={type}>
                    <Table.Cell fontFamily="mono" fontSize="xs" py={1}>{type}</Table.Cell>
                    <Table.Cell fontSize="xs" py={1} textAlign="right">{count}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>

          {/* Heading outline */}
          {analysis.headings.length > 0 && (
            <Box>
              <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color="fg.muted" mb={2}>
                Heading outline ({analysis.headings.length})
              </Text>
              <VStack align="stretch" gap={0.5} maxH="200px" overflowY="auto">
                {analysis.headings.map((h, i) => (
                  <HStack key={i} gap={2} pl={`${(h.level - 1) * 12}px`}>
                    <Badge size="xs" colorPalette={h.empty ? "red" : "gray"} flexShrink={0}>
                      H{h.level}
                    </Badge>
                    <Text fontSize="xs" lineClamp={1} color={h.empty ? "red.500" : undefined}>
                      {h.empty ? "(empty)" : h.text}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* Issues */}
          <Box>
            <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color="fg.muted" mb={2}>
              Issues found ({analysis.issues.length})
            </Text>
            {analysis.issues.length === 0 ? (
              <HStack gap={2} color="green.600">
                <IconCheck size={14} />
                <Text fontSize="sm">No structural issues detected</Text>
              </HStack>
            ) : (
              <VStack align="stretch" gap={1}>
                {analysis.issues.map((issue, i) => (
                  <HStack key={i} gap={2} align="start">
                    <Box color="orange.500" flexShrink={0} mt={0.5}>
                      <IconAlertTriangle size={13} />
                    </Box>
                    <Text fontSize="xs">{issue}</Text>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>

          <Separator />

          {/* Create repaired copy */}
          <Box>
            <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color="fg.muted" mb={1}>
              Create repaired copy
            </Text>
            <Text fontSize="xs" color="fg.muted" mb={3}>
              Removes empty headings, normalizes heading levels (sequential — no jump greater
              than one), trims leading/trailing empty paragraphs. Original draft is untouched.
            </Text>

            <VStack align="stretch" gap={2}>
              <Checkbox.Root
                size="sm"
                checked={removeEmptyParas}
                onCheckedChange={(e) => setRemoveEmptyParas(!!e.checked)}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>
                  <Text fontSize="xs">Remove empty paragraphs</Text>
                </Checkbox.Label>
              </Checkbox.Root>

              <HStack gap={2} fontSize="xs">
                <Text color="fg.muted">Word count:</Text>
                <Text>{analysis.wordCount} → {repairedAnalysis.wordCount}</Text>
                {wordCountMatch ? (
                  <HStack gap={1} color="green.600">
                    <IconCheck size={12} />
                    <Text>match</Text>
                  </HStack>
                ) : (
                  <HStack gap={1} color="red.500">
                    <IconCircleX size={12} />
                    <Text>mismatch — do not create</Text>
                  </HStack>
                )}
              </HStack>

              {createError && (
                <Text fontSize="xs" color="red.500">{createError}</Text>
              )}

              {createResult ? (
                <HStack gap={2} color="green.600">
                  <IconCheck size={14} />
                  <Text fontSize="sm">Created: &ldquo;{createResult.title}&rdquo;</Text>
                </HStack>
              ) : (
                <Button
                  size="sm"
                  colorPalette="orange"
                  variant="outline"
                  disabled={creating || !wordCountMatch || !sponsor.id}
                  onClick={() => void handleCreateRepaired()}
                >
                  {creating ? <Spinner size="xs" mr={2} /> : null}
                  Create repaired copy
                </Button>
              )}

              {!sponsor.id && (
                <Text fontSize="xs" color="fg.muted">
                  (Clone unavailable — sponsor ID not passed through. Open via group admin panel.)
                </Text>
              )}
            </VStack>
          </Box>

          <Separator />

          <Button size="sm" variant="ghost" onClick={onClose} w="full">
            Close
          </Button>

        </VStack>
      </Box>
    </Box>
  );
}

// ─── Mini helper ──────────────────────────────────────────────────────────────

function StatPill({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    <VStack gap={0} align="center" minW="60px">
      <Text fontSize="lg" fontWeight="bold" color={warn ? "orange.500" : undefined}>
        {value}
      </Text>
      <Text fontSize="xs" color="fg.muted">{label}</Text>
    </VStack>
  );
}

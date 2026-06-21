"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { Editor, JSONContent } from "@tiptap/react";
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  NativeSelect,
  Spinner,
  IconButton,
  Badge,
} from "@chakra-ui/react";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";
import { useWriting } from "@hooks/useWriting";
import { useWorkingCopyAutosave } from "@/lib/writing/useWorkingCopyAutosave";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { WorkingDocument } from "@mixtape/core/types/writingTypes";

interface Sponsor {
  type: "group" | "member";
  slug: string;
  displayName?: string;
}

interface DualPanelEditorProps {
  sponsor: Sponsor;
}

interface DocSection {
  id: string;
  heading: string;
  nodes: JSONContent[];
}

// Extract heading-delimited sections from a Tiptap doc.
// Content before the first heading becomes a "Preamble" section.
function extractSections(doc: JSONContent): DocSection[] {
  const topNodes = doc.content ?? [];
  const sections: DocSection[] = [];
  let currentHeading: string | null = null;
  let currentNodes: JSONContent[] = [];

  const flush = (idx: number) => {
    if (currentNodes.length === 0) return;
    sections.push({
      id: `sec-${idx}`,
      heading: currentHeading ?? "Preamble",
      nodes: [...currentNodes],
    });
  };

  for (const node of topNodes) {
    if (node.type === "heading") {
      flush(sections.length);
      currentHeading = extractText(node);
      currentNodes = [node];
    } else {
      currentNodes.push(node);
    }
  }
  flush(sections.length);
  return sections;
}

function extractText(node: JSONContent): string {
  if (!node.content) return "";
  return node.content
    .map((n) => (n.type === "text" ? (n.text ?? "") : extractText(n)))
    .join("");
}

function previewText(nodes: JSONContent[], maxLen = 120): string {
  const body = nodes.filter((n) => n.type !== "heading");
  const raw = body.map((n) => extractText(n)).join(" ").trim();
  return raw.length > maxLen ? raw.slice(0, maxLen) + "…" : raw;
}

export function DualPanelEditor({ sponsor }: DualPanelEditorProps) {
  const { drafts, isLoading: draftsLoading } = useWriting(
    sponsor.type,
    sponsor.slug
  );

  const [leftDocId, setLeftDocId] = useState<string | null>(null);
  const [rightDocId, setRightDocId] = useState<string | null>(null);
  const [pushedIds, setPushedIds] = useState<Set<string>>(new Set());

  const leftEditorRef = useRef<Editor | null>(null);

  const leftDoc: WorkingDocument | undefined = useMemo(
    () => drafts?.find((d) => String(d.id) === leftDocId),
    [drafts, leftDocId]
  );

  const rightDoc: WorkingDocument | undefined = useMemo(
    () => drafts?.find((d) => String(d.id) === rightDocId),
    [drafts, rightDocId]
  );

  const rightSections = useMemo(
    () =>
      rightDoc?.body_json
        ? extractSections(rightDoc.body_json as JSONContent)
        : [],
    [rightDoc]
  );

  // Autosave uses piece.id (the WritingPiece PK), not the WorkingDocument id
  const { schedule, saveStatus } = useWorkingCopyAutosave(
    leftDoc?.piece.id ?? "",
    2500
  );

  const handleContentChange = useCallback(
    (json: JSONContent) => {
      if (!leftDoc) return;
      schedule({
        title: leftDoc.title,
        body_json: json,
        excerpt: leftDoc.excerpt ?? "",
      });
    },
    [leftDoc, schedule]
  );

  const pushSection = useCallback((section: DocSection) => {
    const editor = leftEditorRef.current;
    if (!editor) return;
    const pos = editor.state.doc.content.size;
    editor.chain().focus().insertContentAt(pos, section.nodes).run();
    setPushedIds((prev) => new Set([...prev, section.id]));
  }, []);

  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
      ? "Saved"
      : saveStatus === "error"
      ? "Save error"
      : "";

  if (draftsLoading) {
    return (
      <Flex align="center" justify="center" minH="60vh">
        <Spinner size="lg" color="green.500" />
      </Flex>
    );
  }

  return (
    <Flex className="dpe-root" minH="75vh" w="100%" align="stretch">
      {/* Left — editable target */}
      <Box
        className="dpe-left"
        flex="1"
        borderRightWidth="1px"
        borderColor="border.muted"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <PanelHeader label="Target">
          <DocPicker
            docs={drafts ?? []}
            value={leftDocId}
            exclude={rightDocId}
            onChange={(id) => { setLeftDocId(id); setPushedIds(new Set()); }}
            placeholder="Pick target draft…"
          />
          {saveLabel && (
            <Text fontSize="xs" color="fg.muted" flexShrink={0}>
              {saveLabel}
            </Text>
          )}
        </PanelHeader>

        <Box flex="1" overflowY="auto" p={3}>
          {!leftDoc ? (
            <EmptyState label="Select a draft to edit on the left." />
          ) : (
            <TipTapEditor
              key={String(leftDoc.id)}
              ref={leftEditorRef}
              initialContent={leftDoc.body_json as JSONContent}
              onContentChange={handleContentChange}
              editable
              className="borderless-editor"
            />
          )}
        </Box>
      </Box>

      {/* Right — read-only source */}
      <Box
        className="dpe-right"
        flex="1"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <PanelHeader label="Source">
          <DocPicker
            docs={drafts ?? []}
            value={rightDocId}
            exclude={leftDocId}
            onChange={(id) => { setRightDocId(id); setPushedIds(new Set()); }}
            placeholder="Pick source draft…"
          />
        </PanelHeader>

        <Box flex="1" overflowY="auto" p={3}>
          {!rightDoc ? (
            <EmptyState label="Select a source draft to browse its sections." />
          ) : rightSections.length === 0 ? (
            <EmptyState label="This draft has no content yet." />
          ) : (
            <VStack align="stretch" gap={3}>
              {rightSections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  pushed={pushedIds.has(section.id)}
                  onPush={pushSection}
                  leftReady={!!leftDoc}
                />
              ))}
            </VStack>
          )}
        </Box>
      </Box>
    </Flex>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PanelHeader({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <Box
      className="dpe-panel-header"
      px={3}
      py={2}
      borderBottomWidth="1px"
      borderColor="border.muted"
      bg="bg.subtle"
      position="sticky"
      top={0}
      zIndex={1}
    >
      <HStack gap={2} align="center">
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wider"
          flexShrink={0}
        >
          {label}
        </Text>
        {children}
      </HStack>
    </Box>
  );
}

function DocPicker({
  docs,
  value,
  exclude,
  onChange,
  placeholder,
}: {
  docs: WorkingDocument[];
  value: string | null;
  exclude: string | null;
  onChange: (id: string | null) => void;
  placeholder: string;
}) {
  const available = exclude
    ? docs.filter((d) => String(d.id) !== exclude)
    : docs;
  return (
    <NativeSelect.Root size="xs" flex="1" minW={0}>
      <NativeSelect.Field
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">{placeholder}</option>
        {available.map((d) => (
          <option key={d.id} value={String(d.id)}>
            {d.title || d.piece.title || "(Untitled)"}
          </option>
        ))}
      </NativeSelect.Field>
    </NativeSelect.Root>
  );
}

function SectionCard({
  section,
  pushed,
  onPush,
  leftReady,
}: {
  section: DocSection;
  pushed: boolean;
  onPush: (s: DocSection) => void;
  leftReady: boolean;
}) {
  const preview = previewText(section.nodes);
  return (
    <Box
      className="dpe-section-card"
      borderWidth="1px"
      borderColor={pushed ? "green.300" : "border.muted"}
      borderRadius="md"
      overflow="hidden"
    >
      <HStack
        px={3}
        py={1.5}
        bg="bg.subtle"
        borderBottomWidth="1px"
        borderColor="border.muted"
        gap={2}
      >
        <Text fontWeight="semibold" fontSize="sm" flex={1} minW={0} lineClamp={1}>
          {section.heading}
        </Text>
        <HStack gap={1} flexShrink={0}>
          {pushed && (
            <Badge size="xs" colorPalette="green" variant="subtle">
              <IconCheck size={10} />
            </Badge>
          )}
          <IconButton
            aria-label="Copy section to target"
            size="xs"
            variant="ghost"
            colorPalette="blue"
            disabled={!leftReady}
            onClick={() => onPush(section)}
            title={leftReady ? "Append to target" : "Select a target draft first"}
          >
            <IconArrowLeft size={14} />
          </IconButton>
        </HStack>
      </HStack>
      {preview && (
        <Box px={3} py={2}>
          <Text fontSize="xs" color="fg.muted" lineClamp={3}>
            {preview}
          </Text>
        </Box>
      )}
    </Box>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Box py={8} textAlign="center">
      <Text fontSize="sm" color="fg.muted" fontStyle="italic">
        {label}
      </Text>
    </Box>
  );
}

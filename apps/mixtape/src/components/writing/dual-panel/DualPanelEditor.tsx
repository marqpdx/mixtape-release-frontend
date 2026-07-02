"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
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
import { IconArrowLeft, IconCheck, IconDeviceFloppy, IconRefresh, IconChevronDown, IconChevronRight, IconMicroscope } from "@tabler/icons-react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useWriting } from "@hooks/useWriting";
import { useWorkingCopyAutosave } from "@/lib/writing/useWorkingCopyAutosave";
import { uploadWritingImage } from "@/lib/writing/uploadWritingImage";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { WorkingDocument } from "@mixtape/core/types/writingTypes";
import { StructureCheckPanel } from "@components/writing/StructureCheckPanel";
import type { DualPanelSponsor } from "./DualPanelEditorWorkArea";

interface DualPanelEditorProps {
  sponsor: DualPanelSponsor;
}

interface DocSection {
  id: string;
  heading: string;
  level: number; // 0 = preamble, 1–6 = heading level
  nodes: JSONContent[];
}

// Extract heading-delimited sections from a Tiptap doc.
// Content before the first heading becomes a "Preamble" section (level 0).
function extractSections(doc: JSONContent): DocSection[] {
  const topNodes = doc.content ?? [];
  const sections: DocSection[] = [];
  let currentHeading: string | null = null;
  let currentLevel = 0;
  let currentNodes: JSONContent[] = [];

  const flush = (idx: number) => {
    if (currentNodes.length === 0) return;
    sections.push({
      id: `sec-${idx}`,
      heading: currentHeading ?? "Preamble",
      level: currentLevel,
      nodes: [...currentNodes],
    });
  };

  for (const node of topNodes) {
    if (node.type === "heading") {
      flush(sections.length);
      currentHeading = extractText(node);
      currentLevel = (node.attrs?.level as number) ?? 1;
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

  // body_json is excluded from the list serializer for performance; fetch on select
  const [leftBodyJson, setLeftBodyJson] = useState<JSONContent | null>(null);
  const [rightBodyJson, setRightBodyJson] = useState<JSONContent | null>(null);
  const [leftBodyLoading, setLeftBodyLoading] = useState(false);
  const [rightBodyLoading, setRightBodyLoading] = useState(false);
  const [rightRefreshKey, setRightRefreshKey] = useState(0);
  const [structureCheckDoc, setStructureCheckDoc] = useState<{ bodyJson: JSONContent; title: string; pieceId: string } | null>(null);

  const leftEditorRef = useRef<Editor | null>(null);

  const leftDoc: WorkingDocument | undefined = useMemo(
    () => drafts?.find((d) => String(d.id) === leftDocId),
    [drafts, leftDocId]
  );

  const rightDoc: WorkingDocument | undefined = useMemo(
    () => drafts?.find((d) => String(d.id) === rightDocId),
    [drafts, rightDocId]
  );

  const leftPieceId = leftDoc?.piece.id ?? null;
  const rightPieceId = rightDoc?.piece.id ?? null;

  useEffect(() => {
    if (!leftPieceId) { setLeftBodyJson(null); return; }
    setLeftBodyLoading(true);
    axiosInstance
      .get(`/api/writing/pieces/${leftPieceId}/working-copy`)
      .then((res) => setLeftBodyJson(res.data.body_json ?? null))
      .catch(() => setLeftBodyJson(null))
      .finally(() => setLeftBodyLoading(false));
  }, [leftPieceId]);

  useEffect(() => {
    if (!rightPieceId) { setRightBodyJson(null); return; }
    setRightBodyLoading(true);
    axiosInstance
      .get(`/api/writing/pieces/${rightPieceId}/working-copy`)
      .then((res) => setRightBodyJson(res.data.body_json ?? null))
      .catch(() => setRightBodyJson(null))
      .finally(() => setRightBodyLoading(false));
  }, [rightPieceId, rightRefreshKey]);

  const rightSections = useMemo(
    () => (rightBodyJson ? extractSections(rightBodyJson) : []),
    [rightBodyJson]
  );

  // Autosave uses piece.id (the WritingPiece PK), not the WorkingDocument id
  const { schedule, saveNow, saveStatus } = useWorkingCopyAutosave(
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

  const handleImageUpload = useCallback(
    async (file: File): Promise<string> => {
      if (!leftPieceId) throw new Error("No target piece selected");
      const { serveUrl } = await uploadWritingImage(leftPieceId, file);
      return serveUrl;
    },
    [leftPieceId]
  );

  const pushSection = useCallback(async (section: DocSection) => {
    const editor = leftEditorRef.current;
    if (!editor || !leftDoc) return;

    // TipTap preserves selection state after focus leaves the editor,
    // so reading from state gives the last cursor position the user set.
    const cursorPos = editor.state.selection.from;
    const docEnd = editor.state.doc.content.size;
    // Use cursor if it's a real mid-doc position, otherwise append.
    const insertPos = cursorPos > 1 && cursorPos < docEnd ? cursorPos : docEnd;

    // If not already on an empty paragraph, insert one as a separator.
    const resolvedPos = editor.state.doc.resolve(Math.min(insertPos, docEnd - 1));
    const parentNode = resolvedPos.parent;
    const isOnEmpty = parentNode?.type.name === 'paragraph' && parentNode.childCount === 0;
    const chain = editor.chain().focus();
    if (!isOnEmpty) {
      chain.insertContentAt(insertPos, { type: 'paragraph' });
    }
    chain.insertContentAt(insertPos, section.nodes).run();

    setPushedIds((prev) => new Set([...prev, section.id]));

    const json = editor.getJSON();
    const payload = {
      title: leftDoc.title ?? "",
      body_json: json,
      excerpt: leftDoc.excerpt ?? "",
    };

    // Save to working-copy (solo path, updates wc.body_json).
    await saveNow(payload);

    // For collab docs: also PATCH dispatch content so content_snapshot stays
    // current and the collab editor bootstraps from it on next open.
    if (leftDoc.dispatch_content_id) {
      void axiosInstance.patch(`/api/dispatch/content/${leftDoc.dispatch_content_id}`, {
        body_json: json,
      });
    }
  }, [leftDoc, saveNow]);

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
            onChange={(id) => { setLeftDocId(id); setLeftBodyJson(null); setPushedIds(new Set()); }}
            placeholder="Pick target draft…"
          />
          {saveLabel && (
            <Text fontSize="xs" color="fg.muted" flexShrink={0}>
              {saveLabel}
            </Text>
          )}
          {leftDoc && (
            <IconButton
              aria-label="Save now"
              size="xs"
              variant="ghost"
              colorPalette="green"
              title="Save target draft now"
              flexShrink={0}
              onClick={() => {
                const editor = leftEditorRef.current;
                if (!editor || !leftDoc) return;
                void saveNow({
                  title: leftDoc.title ?? "",
                  body_json: editor.getJSON(),
                  excerpt: leftDoc.excerpt ?? "",
                });
              }}
            >
              <IconDeviceFloppy size={13} />
            </IconButton>
          )}
        </PanelHeader>

        <Box flex="1" overflowY="auto" p={3}>
          {!leftDoc ? (
            <EmptyState label="Select a draft to edit on the left." />
          ) : leftBodyLoading ? (
            <Flex align="center" justify="center" minH="30vh">
              <Spinner size="md" color="green.500" />
            </Flex>
          ) : (
            <TipTapEditor
              key={String(leftDoc.id)}
              ref={leftEditorRef}
              initialContent={leftBodyJson ?? undefined}
              onContentChange={handleContentChange}
              editable
              className="borderless-editor"
              imageUpload={handleImageUpload}
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
            onChange={(id) => { setRightDocId(id); setRightBodyJson(null); setPushedIds(new Set()); }}
            placeholder="Pick source draft…"
          />
          {rightDoc && (
            <>
              <IconButton
                aria-label="Check structure"
                size="xs"
                variant="ghost"
                colorPalette="orange"
                title="Check document structure"
                flexShrink={0}
                onClick={() => {
                  if (rightBodyJson && rightDoc) {
                    setStructureCheckDoc({
                      bodyJson: rightBodyJson,
                      title: rightDoc.title || rightDoc.piece.title || "Untitled",
                      pieceId: rightDoc.piece.id,
                    });
                  }
                }}
              >
                <IconMicroscope size={13} />
              </IconButton>
              <IconButton
                aria-label="Refresh source"
                size="xs"
                variant="ghost"
                disabled={rightBodyLoading}
                onClick={() => setRightRefreshKey((k) => k + 1)}
                flexShrink={0}
              >
                <IconRefresh size={13} />
              </IconButton>
            </>
          )}
        </PanelHeader>

        <Box flex="1" overflowY="auto" p={3}>
          {!rightDoc ? (
            <EmptyState label="Select a source draft to browse its sections." />
          ) : rightBodyLoading ? (
            <Flex align="center" justify="center" minH="30vh">
              <Spinner size="md" color="green.500" />
            </Flex>
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
      {structureCheckDoc && (
        <StructureCheckPanel
          bodyJson={structureCheckDoc.bodyJson}
          title={structureCheckDoc.title}
          pieceId={structureCheckDoc.pieceId}
          sponsor={sponsor}
          onClose={() => setStructureCheckDoc(null)}
        />
      )}
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

function levelIndent(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * 16;
}

function levelPrefix(level: number): string | null {
  if (level <= 1) return null;
  return "|" + "_".repeat(level - 1);
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
  const [expanded, setExpanded] = useState(true);
  const preview = previewText(section.nodes);
  const prefix = levelPrefix(section.level);
  const indent = levelIndent(section.level);
  const hasBody = !!preview;

  return (
    <Box
      className="dpe-section-card"
      ml={`${indent}px`}
      borderWidth="1px"
      borderColor={pushed ? "green.300" : "border.muted"}
      borderRadius="md"
      overflow="hidden"
    >
      <HStack
        px={3}
        py={1.5}
        bg="bg.subtle"
        borderBottomWidth={expanded && hasBody ? "1px" : "0"}
        borderColor="border.muted"
        gap={2}
        cursor={hasBody ? "pointer" : "default"}
        onClick={() => hasBody && setExpanded((e) => !e)}
        _hover={hasBody ? { bg: "bg.muted" } : undefined}
      >
        {prefix && (
          <Text fontSize="xs" color="fg.subtle" fontFamily="mono" flexShrink={0} userSelect="none">
            {prefix}
          </Text>
        )}
        <Text fontWeight="semibold" fontSize="sm" flex={1} minW={0} lineClamp={1}>
          {section.heading}
        </Text>
        <HStack gap={1} flexShrink={0}>
          {pushed && (
            <Badge size="xs" colorPalette="green" variant="subtle">
              <IconCheck size={10} />
            </Badge>
          )}
          {hasBody && (
            <Box color="fg.subtle" lineHeight={1}>
              {expanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
            </Box>
          )}
          <IconButton
            aria-label="Copy section to target"
            size="xs"
            variant="ghost"
            colorPalette="blue"
            disabled={!leftReady}
            onClick={(e) => { e.stopPropagation(); onPush(section); }}
            title={leftReady ? "Append to target" : "Select a target draft first"}
          >
            <IconArrowLeft size={14} />
          </IconButton>
        </HStack>
      </HStack>
      {expanded && hasBody && (
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

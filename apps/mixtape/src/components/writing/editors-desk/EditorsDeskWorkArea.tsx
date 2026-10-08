"use client";
// components/writing/editors-desk/EditorsDeskWorkArea.tsx
// ADR-0054 (+ Phase 3 amendment): Editor's Desk (P1-4 through P1-9, renamed from Run Board,
// then renamed from Issue Board -- "Issue" reads as "problem", kept only as the writing-domain
// noun (an Issue is a thing you publish), not as a surface/route name. See
// decisions/writing-assembly-adr/writing-assembly-status.md.

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  IconButton,
  Input,
  Text,
  Textarea,
  VStack,
  Badge,
  Spinner,
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@chakra-ui/react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { IconPlus, IconX, IconCheck, IconLock, IconTextSpellcheck, IconEye, IconChevronUp, IconChevronDown, IconStar, IconStarFilled, IconPencil, IconDotsVertical } from "@tabler/icons-react";
import { Tooltip } from "@components/ui/tooltip";
import { toaster } from "@components/ui/toaster";
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogCloseTrigger } from "@components/ui/dialog";
import { useIssues, useIssue, useIssueRead } from "@mixtape/api/hooks/useIssueBoard";
import { useWriting } from "@mixtape/api/hooks/useWriting";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useQueryClient } from "@tanstack/react-query";
import type { WorkingDocument, Issue, IssueListItem, IssueReadPlacement } from "@mixtape/core/types/writingTypes";
import { TipTapRenderer, type TipTapDocument } from "@components/tiptap/TipTapRenderer";
import { CraftReadinessDots, type CraftReadiness } from "../draft-room/CraftReadinessDots";
import DraftRoomBodyEditor from "../draft-room/DraftRoomBodyEditor";

interface Sponsor {
  type: "member" | "group";
  slug: string;
  id?: string;
  displayName?: string;
}

interface EditorsDeskWorkAreaProps {
  sponsor: Sponsor;
  initialIssueId?: string;
  onOpenPiece?: (pieceId: string, issueId?: string) => void;
}

// ---------------------------------------------------------------------------
// Status dot — three-color per ADR D4
// ---------------------------------------------------------------------------

type DotColor = "blue" | "green" | "yellow";

function getDocDotColor(doc: WorkingDocument): DotColor {
  if (doc.piece?.status === "published") return "blue";
  if (doc.piece?.spellcheck_clean && doc.piece?.signed_off) return "green";
  return "yellow";
}

const DOT_COLORS: Record<DotColor, string> = {
  blue: "blue.400",
  green: "green.400",
  yellow: "yellow.400",
};

function StatusDot({ color, label }: { color: DotColor; label?: string }) {
  return (
    <Tooltip content={label || color}>
      <Box w="9px" h="9px" borderRadius="full" bg={DOT_COLORS[color]} flexShrink={0} />
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Issue rollup dot — Green only when all placements are Green
// ---------------------------------------------------------------------------

function issueRollupColor(issue: Issue | IssueListItem): DotColor {
  if (issue.status === "published") return "blue";
  if ("placements" in issue) {
    const i = issue as Issue;
    if (!i.placements.length) return "yellow";
    return i.placements.every((p) => p.spellcheck_clean && p.signed_off) ? "green" : "yellow";
  }
  return "yellow";
}

// ---------------------------------------------------------------------------
// Plain text <-> TipTap doc — minimal, paragraph-per-blank-line conversion.
// Good enough for a short welcome/intro; not a rich text editor.
// ---------------------------------------------------------------------------

function textToTipTapDoc(text: string): Record<string, unknown> {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  return {
    type: "doc",
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: [{ type: "text", text: p }],
    })),
  };
}

function tipTapDocToText(doc: Record<string, unknown> | null | undefined): string {
  if (!doc || typeof doc !== "object") return "";
  const content = (doc as { content?: unknown[] }).content;
  if (!Array.isArray(content)) return "";
  const paragraphs: string[] = [];
  for (const node of content) {
    const n = node as { type?: string; content?: { text?: string }[] };
    if (n?.type === "paragraph") {
      paragraphs.push((n.content || []).map((c) => c?.text || "").join(""));
    }
  }
  return paragraphs.join("\n\n");
}

// ---------------------------------------------------------------------------
// Issue details — designation + description (welcome/intro), inline-editable
// ---------------------------------------------------------------------------

interface IssueDetailsEditorProps {
  issue: Issue;
  onSaveDesignation: (designation: string) => void;
  onSaveDescription: (description: Record<string, unknown>) => void;
}

function IssueDetailsEditor({ issue, onSaveDesignation, onSaveDescription }: IssueDetailsEditorProps) {
  const [designation, setDesignation] = useState(issue.designation || "");
  const [description, setDescription] = useState(tipTapDocToText(issue.description));

  return (
    <VStack align="stretch" gap={3} mb={4} pb={4} borderBottomWidth="1px" borderColor="theme.border">
      <HStack gap={2} align="center">
        <Text fontSize="11px" fontWeight="700" color="theme.textSecondary" w="90px" flexShrink={0}>
          Designation
        </Text>
        <Input
          size="xs"
          maxW="240px"
          placeholder="e.g. Issue #1"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          onBlur={() => { if (designation !== (issue.designation || "")) onSaveDesignation(designation); }}
        />
      </HStack>
      <Box>
        <Text fontSize="11px" fontWeight="700" color="theme.textSecondary" mb={1}>
          Description — welcome / intro (shown at the top of Continuous Read)
        </Text>
        <Textarea
          size="sm"
          rows={4}
          placeholder="Write what this Issue is about and why these pieces belong together…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => {
            if (description !== tipTapDocToText(issue.description)) {
              onSaveDescription(textToTipTapDoc(description));
            }
          }}
        />
      </Box>
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// Draggable Doc Card
// ---------------------------------------------------------------------------

interface DocCardProps {
  doc: WorkingDocument;
  inIssue: boolean;
  readiness?: CraftReadiness;
  isDragging?: boolean;
  onOpenPiece?: (pieceId: string) => void;
}

function DocCard({ doc, inIssue, readiness, isDragging, onOpenPiece }: DocCardProps) {
  const dotColor = getDocDotColor(doc);
  const editablePieceId = doc.piece?.id;
  const title = doc.piece?.title || doc.title || "Untitled";
  const previewParagraphs = doc.preview_paragraphs?.length
    ? doc.preview_paragraphs
    : doc.body_preview ? [doc.body_preview] : [];

  return (
    <Tooltip
      disabled={isDragging || previewParagraphs.length === 0}
      openDelay={300}
      positioning={{ placement: "right-start" }}
      contentProps={{
        maxW: "min(420px, calc(100vw - 32px))",
        maxH: "320px",
        overflowY: "auto",
        p: 3,
        bg: "theme.bg",
        color: "theme.text",
        borderWidth: "1px",
        borderColor: "theme.border",
        boxShadow: "lg",
      }}
      content={
        <VStack align="stretch" gap={0}>
          <Text fontSize="sm" fontWeight="600" mb={2}>{title}</Text>
          <VStack align="stretch" gap="5px">
            {previewParagraphs.map((paragraph, index) => (
              <Text
                key={index}
                fontSize="sm"
                lineHeight="1.5"
                whiteSpace="pre-line"
              >
                {paragraph}
              </Text>
            ))}
          </VStack>
        </VStack>
      }
    >
      <Box
        className="edw-doc-card"
        bg="theme.bg"
        borderWidth="1px"
        borderColor={isDragging ? "blue.400" : "theme.border"}
        borderRadius="lg"
        p={3}
        cursor={inIssue ? "default" : "grab"}
        opacity={isDragging ? 0.5 : 1}
        boxShadow={isDragging ? "lg" : "sm"}
        transition="all 0.15s"
        minW={inIssue ? 0 : { base: "0", sm: "225px" }}
        maxW={inIssue ? "full" : "275px"}
        w={inIssue ? "full" : { base: "full", sm: "275px" }}
        userSelect="none"
      >
        <HStack justify="space-between" mb={1.5} align="flex-start">
          <StatusDot
            color={dotColor}
            label={
              dotColor === "blue" ? "Published" :
              dotColor === "green" ? "Ready — spellcheck clean + signed off" :
              "Not ready"
            }
          />
          <HStack gap={1}>
            {editablePieceId && onOpenPiece && !isDragging && (
              <Tooltip content="Edit writing piece">
                <IconButton
                  aria-label={`Edit ${title}`}
                  size="2xs"
                  variant="ghost"
                  cursor="pointer"
                  w="14px"
                  h="14px"
                  minW="14px"
                  minH="14px"
                  p={0}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenPiece(editablePieceId);
                  }}
                >
                  <IconPencil size={14} />
                </IconButton>
              </Tooltip>
            )}
          </HStack>
        </HStack>
        <Text fontSize="12px" fontWeight="600" lineClamp={2} color="theme.text" mb={1}>
          {title}
        </Text>
        {!inIssue && previewParagraphs[0] && (
          <Text fontSize="11px" color="theme.textSecondary" lineClamp={1} mb={1}>
            {previewParagraphs[0]}
          </Text>
        )}
        <HStack gap={2} mt={1}>
          {doc.piece?.spellcheck_clean && (
            <Tooltip content="Spellcheck clean">
              <IconTextSpellcheck size={11} color="green" />
            </Tooltip>
          )}
          {doc.piece?.signed_off && (
            <Tooltip content="Signed off">
              <IconCheck size={11} color="green" />
            </Tooltip>
          )}
        </HStack>
        <Box mt={2}><CraftReadinessDots readiness={readiness} /></Box>
      </Box>
    </Tooltip>
  );
}

function DraggableDocCard({
  doc,
  inIssue,
  readiness,
  onOpenPiece,
}: DocCardProps) {
  const pieceId = doc.piece?.id ?? String(doc.id);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `doc-${pieceId}`,
    data: { type: "doc", pieceId, fromIssue: inIssue ? undefined : null },
  });

  return (
    <Box ref={setNodeRef} {...attributes} {...listeners}>
      <DocCard doc={doc} inIssue={inIssue} readiness={readiness} isDragging={isDragging} onOpenPiece={onOpenPiece} />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Droppable Issue Panel
// ---------------------------------------------------------------------------

interface IssuePanelProps {
  issue: IssueListItem;
  docs: WorkingDocument[];
  readinessByPiece: Record<string, CraftReadiness>;
  isZoomed: boolean;
  otherZoomed: boolean;
  onZoom: () => void;
  onZoomOut: () => void;
  onPreviewToggle: () => void;
  isPreview: boolean;
  onDelete: () => void;
  onOpenPiece?: (pieceId: string) => void;
  onPublish?: () => void;
  onUnpublish?: (cascade: boolean) => void;
  focusedIssueData: Issue | null;
  focusedIssueLoading: boolean;
  onSaveDesignation?: (designation: string) => void;
  onSaveDescription?: (description: Record<string, unknown>) => void;
  onReorder?: (pieceIds: string[]) => void;
  onSetLead?: (pieceId: string, isLead: boolean) => void;
  onRemovePiece?: (pieceId: string) => void;
}

function IssuePanel({
  issue,
  docs,
  readinessByPiece,
  isZoomed,
  otherZoomed,
  onZoom,
  onZoomOut,
  onPreviewToggle,
  isPreview,
  onDelete,
  onOpenPiece,
  onPublish,
  onUnpublish,
  focusedIssueData,
  focusedIssueLoading,
  onSaveDesignation,
  onSaveDescription,
  onReorder,
  onSetLead,
  onRemovePiece,
}: IssuePanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `issue-${issue.id}` });
  const rollup = issueRollupColor(isZoomed && focusedIssueData ? focusedIssueData : issue);

  if (isZoomed) {
    return (
      <Box
        className="edw-issue-panel edw-issue-panel--selected"
        ref={setNodeRef}
        w="full"
        minH="70vh"
        bg="theme.bgSecondary"
        borderWidth="1px"
        borderColor={isOver ? "blue.400" : "theme.border"}
        borderRadius="sm"
        p={4}
      >
        <Flex justify="space-between" align="start" mb={4} gap={2} flexWrap="wrap">
          <HStack gap={3} minW={0}>
            <StatusDot color={rollup} label={`Issue status: ${rollup}`} />
            <Heading size="sm" overflowWrap="anywhere">{issue.title}</Heading>
            {issue.status === "published" && <Badge colorPalette="blue">Published</Badge>}
          </HStack>
          <HStack gap={1} flexShrink={0}>
            <Tooltip content={isPreview ? "Dismiss preview" : "Preview Issue"}>
              <IconButton aria-label={isPreview ? "Dismiss preview" : "Preview Issue"} size="xs" variant="ghost" onClick={onPreviewToggle}>
                <IconEye size={14} />
              </IconButton>
            </Tooltip>
            {issue.status === "draft" && onPublish && (
              <Tooltip content={issue.is_publishable ? "Publish Issue" : "Review spelling and sign off each draft in Preview before publishing"}>
                <Button
                  size="xs"
                  colorPalette="blue"
                  disabled={!issue.is_publishable}
                  onClick={onPublish}
                >
                  <IconLock size={12} />
                  Publish Issue
                </Button>
              </Tooltip>
            )}
            {onUnpublish && (issue.status === "published" || focusedIssueData?.placements.some((placement) => placement.piece_status === "published")) && (
              <MenuRoot positioning={{ placement: "bottom-end" }}>
                <MenuTrigger asChild>
                  <IconButton aria-label="Issue publication actions" size="xs" variant="ghost">
                    <IconDotsVertical size={15} />
                  </IconButton>
                </MenuTrigger>
                <MenuContent>
                  {issue.status === "published" && (
                    <MenuItem value="unpublish-issue" onClick={() => onUnpublish(false)}>
                      Unpublish Issue
                    </MenuItem>
                  )}
                  {focusedIssueData?.placements.some((placement) => placement.piece_status === "published") && (
                    <MenuItem value="return-to-drafts" onClick={() => onUnpublish(true)}>
                      Return Issue and pieces to Drafts
                    </MenuItem>
                  )}
                </MenuContent>
              </MenuRoot>
            )}
            <Tooltip content="Close Issue">
              <IconButton aria-label="Close Issue" size="xs" variant="ghost" onClick={onZoomOut}>
                <IconX size={14} />
              </IconButton>
            </Tooltip>
          </HStack>
        </Flex>

        {focusedIssueLoading ? (
          <Spinner size="sm" />
        ) : (
          <>
            {focusedIssueData && onSaveDesignation && onSaveDescription && (
              <IssueDetailsEditor
                key={focusedIssueData.id}
                issue={focusedIssueData}
                onSaveDesignation={onSaveDesignation}
                onSaveDescription={onSaveDescription}
              />
            )}
            <Box>
              {focusedIssueData && focusedIssueData.placements.length > 0 ? (
                <VStack align="stretch" gap={2}>
                  {focusedIssueData.placements.map((placement, idx) => {
                    const doc = docs.find((d) => d.piece?.id === placement.piece_id);
                    const orderedIds = focusedIssueData.placements.map((p) => p.piece_id);
                    const canMoveUp = idx > 0;
                    const canMoveDown = idx < orderedIds.length - 1;
                    return (
                      <Box key={placement.id} w="full" borderBottomWidth="1px" borderColor="theme.border" pb={2}>
                        <HStack gap={2} align="start" w="full">
                          <Text fontSize="12px" color="theme.textSecondary" w="22px" textAlign="right" flexShrink={0} pt={1}>
                            {placement.order_index + 1}.
                          </Text>
                          <Box minW={0} flex={1}>
                            {isPreview ? (
                              <Box>
                                <Text fontSize="sm" lineClamp={1}>{placement.piece_title}</Text>
                                <CraftReadinessDots readiness={readinessByPiece[placement.piece_id]} />
                              </Box>
                            ) : doc ? (
                              <DocCard doc={doc} inIssue readiness={readinessByPiece[placement.piece_id]} onOpenPiece={onOpenPiece} />
                            ) : (
                              <Box>
                                <Text fontSize="sm" lineClamp={2}>{placement.piece_title}</Text>
                                <CraftReadinessDots readiness={readinessByPiece[placement.piece_id]} />
                              </Box>
                            )}
                          </Box>
                        </HStack>
                        {!isPreview && (
                          <HStack gap={1} justify="flex-end" mt={1}>
                            {onSetLead && (
                              <Tooltip content={placement.is_lead ? "Unmark lead piece" : "Mark as lead piece"}>
                                <IconButton aria-label="Toggle lead" size="2xs" variant="ghost" colorPalette={placement.is_lead ? "yellow" : "gray"} onClick={() => onSetLead(placement.piece_id, !placement.is_lead)}>
                                  {placement.is_lead ? <IconStarFilled size={14} /> : <IconStar size={14} />}
                                </IconButton>
                              </Tooltip>
                            )}
                            {onReorder && (
                              <>
                                <IconButton aria-label="Move up" size="2xs" variant="ghost" disabled={!canMoveUp} onClick={() => {
                                  const next = [...orderedIds];
                                  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                  onReorder(next);
                                }}><IconChevronUp size={12} /></IconButton>
                                <IconButton aria-label="Move down" size="2xs" variant="ghost" disabled={!canMoveDown} onClick={() => {
                                  const next = [...orderedIds];
                                  [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                                  onReorder(next);
                                }}><IconChevronDown size={12} /></IconButton>
                              </>
                            )}
                            {onRemovePiece && (
                              <Tooltip content="Remove from Issue">
                                <IconButton aria-label={`Remove ${placement.piece_title} from Issue`} size="2xs" variant="ghost" onClick={() => onRemovePiece(placement.piece_id)}>
                                  <IconX size={12} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </HStack>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              ) : (
                <Text fontSize="sm" color="theme.textSecondary">
                  No Docs in this Issue yet. Drag Docs here from the canvas.
                </Text>
              )}
            </Box>
          </>
        )}
      </Box>
    );
  }

  // Normal panel
  return (
    <Box
      className="edw-issue-panel"
      ref={setNodeRef}
      borderWidth="1.5px"
      borderColor={isOver ? "blue.400" : otherZoomed ? "theme.border" : "theme.border"}
      borderRadius="xl"
      p={3}
      bg={isOver ? "blue.50" : "theme.bgSecondary"}
      opacity={otherZoomed ? 0.4 : 1}
      filter={otherZoomed ? "blur(1px)" : "none"}
      transition="all 0.2s"
      minW="220px"
      maxW="280px"
      cursor="pointer"
      onClick={onZoom}
      flexShrink={0}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <HStack gap={2}>
          <StatusDot color={rollup} />
          <Text fontSize="13px" fontWeight="700" color="theme.text">
            {issue.title}
          </Text>
        </HStack>
        <HStack gap={1} onClick={(e) => e.stopPropagation()}>
          <Badge size="xs" colorPalette="gray">{issue.member_count}</Badge>
          <Box
            as="button"
            p={0.5}
            borderRadius="sm"
            _hover={{ bg: "red.50" }}
            onClick={onDelete}
          >
            <IconX size={12} color="gray" />
          </Box>
        </HStack>
      </Flex>
      <Text fontSize="11px" color="theme.textSecondary">
        {issue.member_count === 0
          ? "Drop Docs here"
          : `${issue.member_count} Doc${issue.member_count !== 1 ? "s" : ""} — click to expand`}
      </Text>
      {issue.status === "published" && (
        <Badge size="xs" colorPalette="blue" mt={1}>Published</Badge>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Unassigned pool — droppable zone
// ---------------------------------------------------------------------------

function IssuePreviewPiece({
  placement, index, isEditor, onReviewSpelling, onSignOff, onDraftSaved,
}: {
  placement: IssueReadPlacement;
  index: number;
  isEditor: boolean;
  onReviewSpelling: (pieceId: string, revision: number) => Promise<void>;
  onSignOff: (pieceId: string, revision: number) => Promise<void>;
  onDraftSaved: () => void;
}) {
  const [revision, setRevision] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [title, setTitle] = useState(placement.title);
  const dirtyRef = React.useRef(false);
  const handleBodyLoaded = useCallback(() => undefined, []);
  const handleBodyChange = useCallback(() => {
    dirtyRef.current = true;
    setDirty(true);
  }, []);
  const handleTitleChange = useCallback((nextTitle: string) => {
    setTitle(nextTitle);
    dirtyRef.current = true;
    setDirty(true);
  }, []);
  const handleRevisionChange = useCallback((nextRevision: number) => {
    setRevision(nextRevision);
    if (dirtyRef.current) {
      dirtyRef.current = false;
      setDirty(false);
      onDraftSaved();
    }
  }, [onDraftSaved]);
  const runApproval = async (action: (pieceId: string, revision: number) => Promise<void>) => {
    if (revision === null || dirty || pending) return;
    setPending(true);
    try {
      await action(placement.id, revision);
    } finally {
      setPending(false);
    }
  };

  return (
    <Box className="edw-preview-piece" borderTopWidth="1px" borderColor="theme.border" pt={5}>
      <Text fontSize="xs" color="theme.textSecondary" mb={1}>{index + 1}</Text>
      {!(isEditor && placement.status !== "published") && (
        <Heading size="md" mb={4}>{placement.title}</Heading>
      )}
      {isEditor && placement.status !== "published" ? (
        <>
          <DraftRoomBodyEditor
            pieceId={placement.id}
            pieceSlug={placement.slug}
            title={title}
            published={false}
            excerpt={excerpt}
            onExcerptChange={setExcerpt}
            onTitleLoaded={setTitle}
            onTitleChange={handleTitleChange}
            onBodyLoaded={handleBodyLoaded}
            onBodyChange={handleBodyChange}
            onRevisionChange={handleRevisionChange}
          />
          <HStack className="edw-preview-approvals" gap={2} mt={3} flexWrap="wrap">
            <Button
              size="xs"
              variant="outline"
              colorPalette={placement.spellcheck_clean ? "green" : "gray"}
              disabled={revision === null || dirty || pending || placement.spellcheck_clean}
              onClick={() => void runApproval(onReviewSpelling)}
            >
              <IconTextSpellcheck size={14} />
              {placement.spellcheck_clean ? "Spelling reviewed" : "Mark spelling reviewed"}
            </Button>
            <Button
              size="xs"
              variant="outline"
              colorPalette={placement.signed_off ? "green" : "gray"}
              disabled={revision === null || dirty || pending || placement.signed_off}
              onClick={() => void runApproval(onSignOff)}
            >
              <IconCheck size={14} />
              {placement.signed_off ? "Signed off" : "Sign off"}
            </Button>
            {dirty && <Text fontSize="xs" color="theme.textSecondary">Saving draft before review...</Text>}
          </HStack>
        </>
      ) : placement.body_json ? (
        <TipTapRenderer content={placement.body_json as unknown as TipTapDocument} />
      ) : (
        <Text color="theme.textSecondary">No content yet.</Text>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Gist mode -- continuous-scroll reading/editing, body content only. Each
// piece keeps its own independent TipTap instance and autosave (same model
// as everywhere else in this codebase); only the chrome around it is
// stripped, so pieces sit close together and read as near-continuous.
// Named "Gist mode" (not "Focus mode") to avoid colliding with the
// Focus-Centered Writing ADR's unrelated `Focus` model (verb+object that
// organizes attention until resolved) -- decided 2026-10-06, see
// puddlejump decisions/focus-centered-writing-adr/focus-centered-writing-handoff-02.md.
// ---------------------------------------------------------------------------

function IssueGistPiece({ placement, isEditor, onDraftSaved }: {
  placement: IssueReadPlacement;
  isEditor: boolean;
  onDraftSaved: () => void;
}) {
  const [excerpt, setExcerpt] = useState("");
  const handleBodyLoaded = useCallback(() => undefined, []);
  const handleBodyChange = useCallback(() => undefined, []);
  const handleRevisionChange = useCallback(() => {
    onDraftSaved();
  }, [onDraftSaved]);

  if (!isEditor || placement.status === "published") {
    return (
      <Box className="edw-gist-piece">
        {placement.body_json ? (
          <TipTapRenderer content={placement.body_json as unknown as TipTapDocument} />
        ) : (
          <Text color="theme.textSecondary">No content yet.</Text>
        )}
      </Box>
    );
  }

  return (
    <Box className="edw-gist-piece">
      <DraftRoomBodyEditor
        pieceId={placement.id}
        pieceSlug={placement.slug}
        title={placement.title}
        published={false}
        excerpt={excerpt}
        onExcerptChange={setExcerpt}
        hideSummary
        onBodyLoaded={handleBodyLoaded}
        onBodyChange={handleBodyChange}
        onRevisionChange={handleRevisionChange}
      />
    </Box>
  );
}

function IssuePreview({ issueId, mode, onModeChange, onClose, onReviewSpelling, onSignOff }: {
  issueId: string;
  mode: "review" | "gist";
  onModeChange: (mode: "review" | "gist") => void;
  onClose: () => void;
  onReviewSpelling: (pieceId: string, revision: number) => Promise<void>;
  onSignOff: (pieceId: string, revision: number) => Promise<void>;
}) {
  const { data: issue, isLoading } = useIssueRead(issueId);
  const queryClient = useQueryClient();
  const handleDraftSaved = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["writing", "issues"] });
  }, [queryClient]);
  return (
    <Box className="edw-preview" minW={0}>
      <Flex align="center" justify="space-between" mb={5}>
        <Heading size="sm">{issue?.title ?? "Issue Preview"}</Heading>
        <HStack gap={2}>
          <HStack gap={0} borderWidth="1px" borderColor="theme.border" borderRadius="md" p="2px">
            <Button
              size="xs"
              variant={mode === "review" ? "solid" : "ghost"}
              onClick={() => onModeChange("review")}
            >
              Review
            </Button>
            <Button
              size="xs"
              variant={mode === "gist" ? "solid" : "ghost"}
              onClick={() => onModeChange("gist")}
            >
              Gist
            </Button>
          </HStack>
          <Tooltip content="Dismiss preview">
            <IconButton aria-label="Dismiss preview" size="sm" variant="ghost" onClick={onClose}>
              <IconX size={16} />
            </IconButton>
          </Tooltip>
        </HStack>
      </Flex>
      {isLoading && <Spinner size="sm" />}
      {mode === "review" && issue?.description && (
        <Box mb={6}>
          <TipTapRenderer content={issue.description as unknown as TipTapDocument} />
        </Box>
      )}
      <VStack align="stretch" gap={mode === "gist" ? 3 : 8}>
        {issue?.placements.map((placement, index) =>
          mode === "gist" ? (
            <IssueGistPiece key={placement.id} placement={placement} isEditor={issue.is_editor} onDraftSaved={handleDraftSaved} />
          ) : (
            <IssuePreviewPiece
              key={placement.id}
              placement={placement}
              index={index}
              isEditor={issue.is_editor}
              onReviewSpelling={onReviewSpelling}
              onSignOff={onSignOff}
              onDraftSaved={handleDraftSaved}
            />
          )
        )}
        {issue && issue.placements.length === 0 && (
          <Text color="theme.textSecondary">No pieces in this Issue yet.</Text>
        )}
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Create Issue form
// ---------------------------------------------------------------------------

function CreateIssueForm({ onCreate }: { onCreate: (title: string) => void }) {
  const [title, setTitle] = useState("");
  const [active, setActive] = useState(false);

  const submit = () => {
    if (title.trim()) {
      onCreate(title.trim());
      setTitle("");
      setActive(false);
    }
  };

  if (!active) {
    return (
      <Button size="sm" variant="outline" onClick={() => setActive(true)}>
        <IconPlus size={14} />
        New Issue
      </Button>
    );
  }

  return (
    <HStack gap={2}>
      <Input
        size="sm"
        placeholder="Issue title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setActive(false); }}
        autoFocus
        maxW="220px"
      />
      <Button size="sm" colorPalette="blue" onClick={submit} disabled={!title.trim()}>
        Create
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setActive(false)}>
        Cancel
      </Button>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Main board
// ---------------------------------------------------------------------------

export function EditorsDeskWorkArea({ sponsor, initialIssueId, onOpenPiece }: EditorsDeskWorkAreaProps) {
  const { issues, isLoading: issuesLoading, createIssue, deleteIssue, addToIssue, removeFromIssue } = useIssues(sponsor);
  const { drafts, isLoading: docsLoading } = useWriting(sponsor.type, sponsor.slug);
  const [readinessByPiece, setReadinessByPiece] = useState<Record<string, CraftReadiness>>({});

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(initialIssueId ?? null);
  const [issueDismissed, setIssueDismissed] = useState(false);
  const [unpublishRequest, setUnpublishRequest] = useState<{
    issueId: string;
    cascade: boolean;
    titles: string[];
  } | null>(null);
  const [previewMode, setPreviewMode] = useState<"board" | "review" | "gist">("board");
  const isPreview = previewMode !== "board";
  const setIsPreview = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setPreviewMode((prevMode) => {
      const prevBool = prevMode !== "board";
      const nextBool = typeof value === "function" ? value(prevBool) : value;
      return nextBool ? "review" : "board";
    });
  }, []);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const focusedIssueId = issueDismissed
    ? null
    : selectedIssueId && issues.some((issue) => issue.id === selectedIssueId)
      ? selectedIssueId
      : issues[0]?.id ?? null;

  useEffect(() => {
    if (!focusedIssueId) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && unpublishRequest === null) {
        setIssueDismissed(true);
        setIsPreview(false);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [focusedIssueId, setIsPreview, unpublishRequest]);

  const {
    issue: focusedIssueData,
    isLoading: focusedIssueLoading,
    publishIssue,
    unpublishIssue,
    signOffPiece,
    reviewSpelling,
    updateIssue,
    reorderPlacements,
    setPlacementLead,
  } = useIssue(focusedIssueId);

  const readinessIds = useMemo(() => [...new Set([
    ...drafts.map((doc) => doc.piece?.id).filter((id): id is string => Boolean(id)),
    ...(focusedIssueData?.placements.map((placement) => placement.piece_id) ?? []),
  ])].sort().join(","), [drafts, focusedIssueData]);

  useEffect(() => {
    if (!readinessIds) {
      setReadinessByPiece({});
      return;
    }
    let active = true;
    const ids = readinessIds.split(",");
    const batches = Array.from({ length: Math.ceil(ids.length / 100) }, (_, index) => ids.slice(index * 100, (index + 1) * 100));
    void Promise.all(batches.map((batch) =>
      axiosInstance.get<Record<string, CraftReadiness>>("/api/atelier/readiness/batch/", {
        params: { ids: batch.join(",") },
      })
    )).then((responses) => {
      if (active) setReadinessByPiece(Object.assign({}, ...responses.map((response) => response.data)));
    }).catch(() => {
      if (active) setReadinessByPiece({});
    });
    return () => { active = false; };
  }, [readinessIds]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const pieceIssueMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const issue of issues) {
      for (const pieceId of issue.piece_ids) {
        map[pieceId] = issue.id;
      }
    }
    return map;
  }, [issues]);

  // All piece IDs that are in any issue (based on what we know)
  const assignedPieceIds = useMemo(() => new Set(Object.keys(pieceIssueMap)), [pieceIssueMap]);

  // Unassigned docs = docs not in pieceIssueMap
  const unassignedDocs = useMemo(
    () => drafts.filter((d) => !assignedPieceIds.has(d.piece?.id ?? "")),
    [drafts, assignedPieceIds]
  );

  const activeDragDoc = useMemo(() => {
    if (!activeDragId) return null;
    const pieceId = activeDragId.replace("doc-", "");
    return drafts.find((d) => (d.piece?.id ?? String(d.id)) === pieceId) ?? null;
  }, [activeDragId, drafts]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleOpenPiece = useCallback((pieceId: string) => {
    onOpenPiece?.(pieceId, focusedIssueId ?? undefined);
  }, [onOpenPiece, focusedIssueId]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const pieceId = String(active.id).replace("doc-", "");
    const targetId = String(over.id);

    if (targetId.startsWith("issue-")) {
      const issueId = targetId.replace("issue-", "");
      const currentIssueId = pieceIssueMap[pieceId];
      if (currentIssueId) return;

      try {
        await addToIssue.mutateAsync({ issueId, pieceId });
        setSelectedIssueId(issueId);
        setIssueDismissed(false);
        toaster.create({ title: "Added to Issue", type: "success" });
      } catch (e) {
        const err = e as { response?: { data?: { detail?: string } } };
        toaster.create({ title: err?.response?.data?.detail || "Failed to add to Issue", type: "error" });
      }
    }
  }, [pieceIssueMap, addToIssue]);

  const handleRemovePiece = useCallback(async (pieceId: string) => {
    if (!focusedIssueId) return;
    try {
      await removeFromIssue.mutateAsync({ issueId: focusedIssueId, pieceId });
      toaster.create({ title: "Removed from Issue", type: "success" });
    } catch {
      toaster.create({ title: "Failed to remove from Issue", type: "error" });
    }
  }, [focusedIssueId, removeFromIssue]);

  const handlePublish = useCallback(async () => {
    if (!focusedIssueId) return;
    try {
      await publishIssue.mutateAsync();
      toaster.create({ title: "Issue published — all Docs are now live", type: "success" });
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string; not_ready?: string[] } } };
      const detail = err?.response?.data?.detail || "Publish failed";
      const notReady: string[] = err?.response?.data?.not_ready || [];
      toaster.create({
        title: detail,
        description: notReady.length ? `Not ready: ${notReady.join(", ")}` : undefined,
        type: "error",
      });
    }
  }, [focusedIssueId, publishIssue]);

  const handleUnpublish = useCallback(async () => {
    if (!unpublishRequest) return;
    try {
      await unpublishIssue.mutateAsync({
        issueId: unpublishRequest.issueId,
        cascade: unpublishRequest.cascade,
      });
      toaster.create({
        title: unpublishRequest.cascade ? "Issue and pieces returned to Drafts" : "Issue returned to draft; pieces remain published",
        type: "success",
      });
      setUnpublishRequest(null);
    } catch (error) {
      const data = (error as { response?: { data?: { detail?: string; shared_pieces?: string[] } } })?.response?.data;
      toaster.create({
        title: data?.detail || "Could not unpublish Issue",
        description: data?.shared_pieces?.join(", "),
        type: "error",
      });
    }
  }, [unpublishRequest, unpublishIssue]);

  const handleSignOff = useCallback(async (pieceId: string, revision: number) => {
    if (!focusedIssueId) return;
    try {
      await signOffPiece.mutateAsync({ pieceId, revision });
      toaster.create({ title: "Doc signed off", type: "success" });
    } catch (error) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toaster.create({ title: "Sign-off failed", description: detail, type: "error" });
    }
  }, [focusedIssueId, signOffPiece]);

  const handleReviewSpelling = useCallback(async (pieceId: string, revision: number) => {
    if (!focusedIssueId) return;
    try {
      await reviewSpelling.mutateAsync({ pieceId, revision });
      toaster.create({ title: "Spelling review recorded", type: "success" });
    } catch (error) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toaster.create({ title: "Spelling review failed", description: detail, type: "error" });
    }
  }, [focusedIssueId, reviewSpelling]);

  const handleSaveDesignation = useCallback((designation: string) => {
    updateIssue.mutate({ designation }, {
      onError: () => toaster.create({ title: "Failed to save designation", type: "error" }),
    });
  }, [updateIssue]);

  const handleSaveDescription = useCallback((description: Record<string, unknown>) => {
    updateIssue.mutate({ description }, {
      onError: () => toaster.create({ title: "Failed to save description", type: "error" }),
    });
  }, [updateIssue]);

  const handleReorder = useCallback((pieceIds: string[]) => {
    reorderPlacements.mutate(pieceIds, {
      onError: () => toaster.create({ title: "Failed to reorder", type: "error" }),
    });
  }, [reorderPlacements]);

  const handleSetLead = useCallback((pieceId: string, isLead: boolean) => {
    setPlacementLead.mutate({ pieceId, isLead }, {
      onError: () => toaster.create({ title: "Failed to update lead", type: "error" }),
    });
  }, [setPlacementLead]);

  const handleDeleteIssue = useCallback(async (issueId: string) => {
    try {
      await deleteIssue.mutateAsync(issueId);
      if (focusedIssueId === issueId) {
        setSelectedIssueId(null);
        setIsPreview(false);
      }
    } catch {
      toaster.create({ title: "Failed to delete Issue", type: "error" });
    }
  }, [deleteIssue, focusedIssueId, setIsPreview]);

  const isLoading = issuesLoading || docsLoading;

  return (
    <Box className="edw-root" w="full" minH="80vh" position="relative">
      {/* Header */}
      <Flex className="edw-header" align="center" justify="space-between" mb={4} flexWrap="wrap" gap={3}>
        <VStack align="start" gap={0}>
          <Heading size="md">Editor&apos;s Desk</Heading>
          <Text fontSize="12px" color="theme.textSecondary">
            Group Docs into Issues and publish them together as a unit.{" "}
            <Text as="span" fontWeight="600">Superuser preview.</Text>
          </Text>
        </VStack>
        <CreateIssueForm onCreate={(title) => createIssue.mutate(title)} />
      </Flex>

      {isLoading && (
        <Flex justify="center" py={8}><Spinner /></Flex>
      )}

      {!isLoading && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveDragId(null);
          }}
        >
          <Box
            className="edw-workspace"
            display="grid"
            gridTemplateColumns={{
              base: "minmax(0, 1fr)",
              lg: isPreview ? "minmax(260px, 23%) minmax(0, 1fr)" : "minmax(320px, 35%) minmax(0, 1fr)",
            }}
            gap={5}
            alignItems="stretch"
            minH="70vh"
          >
            <Box className="edw-issue-rail" minW={0}>
              <Text fontSize="11px" fontWeight="700" letterSpacing="wider" textTransform="uppercase" color="theme.textSecondary" mb={2}>
                Issues
              </Text>
              {issues.filter((issue) => issue.id !== focusedIssueId).length > 0 && (
                <Flex gap={2} flexWrap="wrap" mb={3}>
                  {issues.filter((issue) => issue.id !== focusedIssueId).map((issue) => (
                    <IssuePanel
                      key={issue.id}
                      issue={issue}
                      docs={drafts}
                      readinessByPiece={readinessByPiece}
                      isZoomed={false}
                      otherZoomed={false}
                      onZoom={() => {
                        setSelectedIssueId(issue.id);
                        setIssueDismissed(false);
                      }}
                      onZoomOut={() => setIssueDismissed(true)}
                      onPreviewToggle={() => setIsPreview((value) => !value)}
                      isPreview={isPreview}
                      onDelete={() => handleDeleteIssue(issue.id)}
                      focusedIssueData={null}
                      focusedIssueLoading={false}
                    />
                  ))}
                </Flex>
              )}
              {focusedIssueId && issues.find((issue) => issue.id === focusedIssueId) && (
                <IssuePanel
                  key={focusedIssueId}
                  issue={issues.find((issue) => issue.id === focusedIssueId)!}
                  docs={drafts}
                  readinessByPiece={readinessByPiece}
                  isZoomed
                  otherZoomed={false}
                  onZoom={() => undefined}
                  onZoomOut={() => {
                    setIssueDismissed(true);
                    setIsPreview(false);
                  }}
                  onPreviewToggle={() => setIsPreview((value) => !value)}
                  isPreview={isPreview}
                  onDelete={() => handleDeleteIssue(focusedIssueId)}
                  onOpenPiece={onOpenPiece ? handleOpenPiece : undefined}
                  onPublish={handlePublish}
                  onUnpublish={(cascade) => setUnpublishRequest({
                    issueId: focusedIssueId,
                    cascade,
                    titles: focusedIssueData?.placements.map((placement) => placement.piece_title) ?? [],
                  })}
                  focusedIssueData={focusedIssueData ?? null}
                  focusedIssueLoading={focusedIssueLoading}
                  onSaveDesignation={handleSaveDesignation}
                  onSaveDescription={handleSaveDescription}
                  onReorder={handleReorder}
                  onSetLead={handleSetLead}
                  onRemovePiece={handleRemovePiece}
                />
              )}
              {issues.length === 0 && (
                <Text fontSize="sm" color="theme.textSecondary">Create an Issue to begin.</Text>
              )}
            </Box>

            <Box className="edw-canvas-docs" minW={0}>
              {isPreview && focusedIssueId ? (
                <IssuePreview
                  issueId={focusedIssueId}
                  mode={previewMode === "gist" ? "gist" : "review"}
                  onModeChange={setPreviewMode}
                  onClose={() => setPreviewMode("board")}
                  onReviewSpelling={handleReviewSpelling}
                  onSignOff={handleSignOff}
                />
              ) : (
                <>
                  <Text fontSize="11px" fontWeight="700" letterSpacing="wider" textTransform="uppercase" color="theme.textSecondary" mb={2}>
                    Docs ({unassignedDocs.length} unassigned)
                  </Text>
                  {unassignedDocs.length === 0 && issues.length === 0 && (
                    <Text fontSize="sm" color="theme.textSecondary" py={4}>
                      No drafts yet. Create some writing pieces to get started.
                    </Text>
                  )}
                  <Flex gap={3} flexWrap="wrap" align="flex-start">
                    {unassignedDocs.map((doc) => (
                      <DraggableDocCard
                        key={doc.piece?.id ?? doc.id}
                        doc={doc}
                        inIssue={false}
                        readiness={doc.piece?.id ? readinessByPiece[doc.piece.id] : undefined}
                        onOpenPiece={onOpenPiece ? handleOpenPiece : undefined}
                      />
                    ))}
                  </Flex>
                </>
              )}
            </Box>
          </Box>

          {/* Drag overlay */}
          <DragOverlay>
            {activeDragDoc && (
              <DocCard doc={activeDragDoc} inIssue={false} readiness={activeDragDoc.piece?.id ? readinessByPiece[activeDragDoc.piece.id] : undefined} isDragging />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Legend */}
      <Box className="edw-legend" mt={6} pt={4} borderTopWidth="1px" borderColor="theme.border">
        <HStack gap={4} flexWrap="wrap">
          <HStack gap={1.5}><Box w="8px" h="8px" borderRadius="full" bg="yellow.400" /><Text fontSize="11px" color="theme.textSecondary">Not ready</Text></HStack>
          <HStack gap={1.5}><Box w="8px" h="8px" borderRadius="full" bg="green.400" /><Text fontSize="11px" color="theme.textSecondary">Spellcheck clean + signed off</Text></HStack>
          <HStack gap={1.5}><Box w="8px" h="8px" borderRadius="full" bg="blue.400" /><Text fontSize="11px" color="theme.textSecondary">Published</Text></HStack>
        </HStack>
      </Box>

      <DialogRoot open={unpublishRequest !== null} onOpenChange={({ open }) => !open && setUnpublishRequest(null)}>
        <DialogContent>
          <DialogHeader>{unpublishRequest?.cascade ? "Return Issue and pieces to Drafts?" : "Unpublish Issue?"}</DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            {unpublishRequest?.cascade ? (
              <>
                <Text mb={2}>These pieces will also become drafts and disappear from their published destinations:</Text>
                <VStack align="start" gap={1}>
                  {unpublishRequest.titles.map((title, index) => (
                    <Text key={`${index}-${title}`} fontSize="sm">{title}</Text>
                  ))}
                </VStack>
                <Text mt={3} fontSize="sm">Pieces used by another published Issue cannot be returned to drafts.</Text>
              </>
            ) : (
              <Text>The Issue will return to draft. Its pieces will remain published and visible in their current destinations.</Text>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUnpublishRequest(null)}>Cancel</Button>
            <Button colorPalette="orange" onClick={handleUnpublish} disabled={unpublishIssue.isPending}>
              {unpublishIssue.isPending ? "Updating..." : unpublishRequest?.cascade ? "Return all to Drafts" : "Unpublish Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}

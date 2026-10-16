// apps/mixtape/src/components/writing/editors-desk-merged/EditorsDeskMergedWorkArea.tsx
//
// Greenfield blend of Draft Room + Editor's Desk (CTO, 2026-10-15: "they
// are like 1.5 things ... I'm hoping we can collapse it into a single
// surface"). Additive and parallel — DraftRoomWorkArea.tsx and
// EditorsDeskWorkArea.tsx are untouched and still fully reachable; this is
// a new rim position, not a replacement, so there is nothing to break.
//
// Reuse, don't fork: the craft layer (DraftRoomBodyEditor, AtelierShapeTab,
// AtelierMetaTab, CraftReadinessDots) is the same components Draft Room
// itself uses, imported directly. The assembly layer (issues, placements,
// reorder, lead piece, sign-off, spellcheck, publish) reuses the same
// useIssues/useIssue hooks Editor's Desk uses. What's new here is only the
// orchestration gluing craft and assembly into one surface — Editor's
// Desk's own row/card/panel JSX is private to that file and unexported, so
// that presentation layer is necessarily rebuilt, not copied.
//
// Scope, deliberately: drag-and-drop reorder and add-to-issue (dnd-kit,
// in EditorsDeskWorkArea) are replaced here with up/down buttons and a
// simple picker — same end mutations, lower-risk interaction for a first
// pass. LinkedIn prep and the Gist/continuous-read preview mode are not
// ported in this pass either.

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
  createListCollection,
  Select,
  Portal,
} from "@chakra-ui/react";
import type { JSONContent } from "@tiptap/react";
import {
  IconChevronDown,
  IconChevronUp,
  IconLock,
  IconPlus,
  IconStar,
  IconStarFilled,
  IconTextSpellcheck,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@components/ui/toaster";
import { Tooltip } from "@components/ui/tooltip";
import { useIssues, useIssue } from "@mixtape/api/hooks/useIssueBoard";
import { useWriting } from "@hooks/useWriting";
import type { IssuePlacement } from "@mixtape/core/types/writingTypes";
import DraftRoomBodyEditor from "@/components/writing/draft-room/DraftRoomBodyEditor";
import AtelierShapeTab from "@/components/writing/draft-room/AtelierShapeTab";
import AtelierMetaTab from "@/components/writing/draft-room/AtelierMetaTab";
import { CraftReadinessDots, type CraftReadiness } from "@/components/writing/draft-room/CraftReadinessDots";
import type { Tag } from "@/components/writing/composer/TagInput";
import type { Category } from "@/components/writing/composer/CategoryInput";

const ACCENT_COLOR = "amber";

interface EditorsDeskMergedSponsor {
  type: "group" | "member";
  id: string;
  slug: string;
  displayName: string;
}

interface EditorsDeskMergedWorkAreaProps {
  sponsor: EditorsDeskMergedSponsor;
}

function toIdList(ids: Array<number | string>): number[] {
  return ids.map((id) => (typeof id === "string" ? parseInt(id, 10) : id)).filter((id) => !Number.isNaN(id));
}

function IssueRailCard({
  title,
  status,
  focused,
  onClick,
  onDelete,
}: {
  title: string;
  status: string;
  focused: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <HStack
      justify="space-between"
      px={3}
      py={2}
      borderRadius="md"
      borderWidth="1px"
      borderColor={focused ? `${ACCENT_COLOR}.400` : "border.muted"}
      bg={focused ? `${ACCENT_COLOR}.50` : "transparent"}
      _dark={focused ? { bg: "whiteAlpha.100" } : undefined}
      cursor="pointer"
      onClick={onClick}
    >
      <VStack align="stretch" gap={0} minW={0}>
        <Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
          {title}
        </Text>
        <Badge size="xs" variant="subtle" alignSelf="flex-start">
          {status}
        </Badge>
      </VStack>
      <IconButton
        aria-label="Delete Issue"
        size="2xs"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <IconX size={12} />
      </IconButton>
    </HStack>
  );
}

function CreateIssueInline({ onCreate }: { onCreate: (title: string) => void }) {
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState("");

  if (!active) {
    return (
      <Button size="xs" variant="outline" onClick={() => setActive(true)}>
        <IconPlus size={14} /> New Issue
      </Button>
    );
  }

  const submit = () => {
    if (title.trim()) {
      onCreate(title.trim());
      setTitle("");
      setActive(false);
    }
  };

  return (
    <HStack>
      <Input
        size="sm"
        autoFocus
        placeholder="Issue title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setActive(false);
        }}
      />
      <Button size="xs" colorScheme={ACCENT_COLOR} onClick={submit}>
        Create
      </Button>
      <Button size="xs" variant="ghost" onClick={() => setActive(false)}>
        Cancel
      </Button>
    </HStack>
  );
}

function PlacementRow({
  placement,
  index,
  total,
  selected,
  readiness,
  onSelect,
  onMoveUp,
  onMoveDown,
  onSetLead,
  onRemove,
}: {
  placement: IssuePlacement;
  index: number;
  total: number;
  selected: boolean;
  readiness?: CraftReadiness;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetLead: () => void;
  onRemove: () => void;
}) {
  return (
    <HStack
      justify="space-between"
      px={2}
      py={1.5}
      borderRadius="md"
      borderWidth="1px"
      borderColor={selected ? `${ACCENT_COLOR}.400` : "border.muted"}
      bg={selected ? `${ACCENT_COLOR}.50` : "transparent"}
      _dark={selected ? { bg: "whiteAlpha.100" } : undefined}
      cursor="pointer"
      onClick={onSelect}
    >
      <HStack gap={2} minW={0}>
        <Tooltip content={placement.is_lead ? "Unmark lead piece" : "Mark as lead piece"}>
          <IconButton
            aria-label="Toggle lead"
            size="2xs"
            variant="ghost"
            colorPalette={placement.is_lead ? "yellow" : "gray"}
            onClick={(e) => {
              e.stopPropagation();
              onSetLead();
            }}
          >
            {placement.is_lead ? <IconStarFilled size={13} /> : <IconStar size={13} />}
          </IconButton>
        </Tooltip>
        <Text fontSize="sm" lineClamp={1}>
          {placement.piece_title || "Untitled"}
        </Text>
        {placement.spellcheck_clean && <IconTextSpellcheck size={13} color="var(--chakra-colors-green-600)" />}
        {placement.signed_off && <IconCheck size={13} color="var(--chakra-colors-green-600)" />}
        <CraftReadinessDots readiness={readiness} />
      </HStack>
      <HStack gap={0} flexShrink={0}>
        <IconButton aria-label="Move up" size="2xs" variant="ghost" disabled={index === 0} onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
          <IconChevronUp size={12} />
        </IconButton>
        <IconButton aria-label="Move down" size="2xs" variant="ghost" disabled={index === total - 1} onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
          <IconChevronDown size={12} />
        </IconButton>
        <IconButton aria-label="Remove from Issue" size="2xs" variant="ghost" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          <IconX size={12} />
        </IconButton>
      </HStack>
    </HStack>
  );
}

export function EditorsDeskMergedWorkArea({ sponsor }: EditorsDeskMergedWorkAreaProps) {
  const { issues, createIssue, deleteIssue, addToIssue, removeFromIssue } = useIssues({ type: sponsor.type, slug: sponsor.slug });
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);
  const { issue, setPlacementLead, reorderPlacements, signOffPiece, reviewSpelling, publishIssue } = useIssue(focusedIssueId);
  const { drafts } = useWriting(sponsor.type, sponsor.slug);

  const placements = useMemo(() => issue?.placements ?? [], [issue]);

  const assignedPieceIds = useMemo(() => {
    const ids = new Set<string>();
    issues.forEach((i) => i.piece_ids.forEach((id) => ids.add(id)));
    return ids;
  }, [issues]);
  const unassignedDrafts = useMemo(() => drafts.filter((d) => !assignedPieceIds.has(d.piece.id)), [drafts, assignedPieceIds]);
  const addPieceCollection = useMemo(
    () => createListCollection({ items: unassignedDrafts.map((d) => ({ value: d.piece.id, label: d.piece.title || "Untitled" })) }),
    [unassignedDrafts]
  );

  // Craft state for whichever placement is currently selected — same shape
  // DraftRoomWorkArea keeps for its one selected piece.
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const selectedPlacement = placements.find((p) => p.piece_id === selectedPieceId) ?? null;

  const [title, setTitle] = useState("");
  const [addressedTo, setAddressedTo] = useState("public");
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [revision, setRevision] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [showAutoSaved, setShowAutoSaved] = useState(false);
  const [approvalPending, setApprovalPending] = useState(false);
  const [readinessByPiece, setReadinessByPiece] = useState<Record<string, CraftReadiness>>({});

  // Load tags/categories/title when the selected piece changes.
  useEffect(() => {
    if (!selectedPlacement) return;
    setTitle(selectedPlacement.piece_title || "");
    setAddressedTo("public");
    setExcerpt("");
    setRevision(null);
    setDirty(false);
    let active = true;
    Promise.all([
      axiosInstance.get<Tag[]>(`/api/writing/pieces/${selectedPlacement.piece_id}/tags`),
      axiosInstance.get<Category[]>(`/api/writing/pieces/${selectedPlacement.piece_id}/categories`),
    ])
      .then(([tagsRes, catsRes]) => {
        if (!active) return;
        setTags(tagsRes.data);
        setCategories(catsRes.data);
      })
      .catch(() => {
        if (active) {
          setTags([]);
          setCategories([]);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlacement?.piece_id]);

  // Debounced metadata autosave — same 2500ms pattern as DraftRoomWorkArea.
  useEffect(() => {
    if (!selectedPlacement) return;
    const timeout = window.setTimeout(() => {
      void (async () => {
        setSavingMeta(true);
        try {
          await axiosInstance.patch(`/api/writing/pieces/${selectedPlacement.piece_id}`, { title, addressed_to: addressedTo });
          await axiosInstance.put(`/api/writing/pieces/${selectedPlacement.piece_id}/tags`, { tag_ids: toIdList(tags.map((t) => t.id)) });
          await axiosInstance.put(`/api/writing/pieces/${selectedPlacement.piece_id}/categories`, { category_ids: toIdList(categories.map((c) => c.id)) });
          setShowAutoSaved(true);
          window.setTimeout(() => setShowAutoSaved(false), 2500);
        } catch {
          toaster.create({ title: "Could not save metadata", type: "error" });
        } finally {
          setSavingMeta(false);
        }
      })();
    }, 2500);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, addressedTo, tags, categories]);

  // Readiness, batched — same endpoint/shape as DraftRoomWorkArea, scoped to the focused Issue's pieces.
  useEffect(() => {
    const ids = placements.map((p) => p.piece_id);
    if (ids.length === 0) {
      setReadinessByPiece({});
      return;
    }
    let active = true;
    axiosInstance
      .get<Record<string, CraftReadiness>>("/api/atelier/readiness/batch/", { params: { ids: ids.join(",") } })
      .then((res) => {
        if (active) setReadinessByPiece(res.data);
      })
      .catch(() => {
        if (active) setReadinessByPiece({});
      });
    return () => {
      active = false;
    };
  }, [placements]);

  const runApproval = async (action: (args: { pieceId: string; revision: number }) => Promise<unknown>) => {
    if (!selectedPlacement || revision === null || dirty || approvalPending) return;
    setApprovalPending(true);
    try {
      await action({ pieceId: selectedPlacement.piece_id, revision });
    } catch {
      toaster.create({ title: "Action failed", type: "error" });
    } finally {
      setApprovalPending(false);
    }
  };

  const handleReorder = (pieceIds: string[]) => {
    reorderPlacements.mutate(pieceIds, { onError: () => toaster.create({ title: "Failed to reorder", type: "error" }) });
  };

  return (
    <Box display="flex" gap={4} h="100%" minH="0">
      {/* Issue rail */}
      <VStack align="stretch" gap={2} minW="220px" maxW="220px" borderRight="1px solid" borderColor="border.muted" pr={3} overflowY="auto">
        <Heading size="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
          Issues
        </Heading>
        {issues.map((i) => (
          <IssueRailCard
            key={i.id}
            title={i.title}
            status={i.status}
            focused={i.id === focusedIssueId}
            onClick={() => {
              setFocusedIssueId(i.id);
              setSelectedPieceId(null);
            }}
            onDelete={() => {
              deleteIssue.mutate(i.id, { onSuccess: () => { if (focusedIssueId === i.id) setFocusedIssueId(null); } });
            }}
          />
        ))}
        <CreateIssueInline onCreate={(t) => createIssue.mutate(t)} />
      </VStack>

      {!issue ? (
        <Box flex="1" display="flex" alignItems="center" justifyContent="center">
          <Text color="fg.muted" fontSize="sm">
            Select or create an Issue to begin.
          </Text>
        </Box>
      ) : (
        <>
          {/* Placement list */}
          <VStack align="stretch" gap={2} minW="280px" maxW="280px" borderRight="1px solid" borderColor="border.muted" pr={3} overflowY="auto">
            <HStack justify="space-between">
              <Heading size="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
                {issue.title}
              </Heading>
              <Tooltip content={issue.is_publishable ? "Publish Issue" : "Every piece must be signed off first"}>
                <Button
                  size="2xs"
                  colorScheme="blue"
                  disabled={!issue.is_publishable || issue.status !== "draft"}
                  onClick={() => {
                    void publishIssue.mutateAsync().then(
                      () => toaster.create({ title: "Issue published", type: "success" }),
                      () => toaster.create({ title: "Publish failed", type: "error" })
                    );
                  }}
                >
                  <IconLock size={11} /> Publish
                </Button>
              </Tooltip>
            </HStack>

            {placements.map((p, index) => (
              <PlacementRow
                key={p.id}
                placement={p}
                index={index}
                total={placements.length}
                selected={p.piece_id === selectedPieceId}
                readiness={readinessByPiece[p.piece_id]}
                onSelect={() => setSelectedPieceId(p.piece_id)}
                onMoveUp={() => {
                  const ids = placements.map((pl) => pl.piece_id);
                  [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                  handleReorder(ids);
                }}
                onMoveDown={() => {
                  const ids = placements.map((pl) => pl.piece_id);
                  [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
                  handleReorder(ids);
                }}
                onSetLead={() =>
                  setPlacementLead.mutate(
                    { pieceId: p.piece_id, isLead: !p.is_lead },
                    { onError: () => toaster.create({ title: "Failed to update lead", type: "error" }) }
                  )
                }
                onRemove={() => {
                  removeFromIssue.mutate({ issueId: issue.id, pieceId: p.piece_id });
                  if (selectedPieceId === p.piece_id) setSelectedPieceId(null);
                }}
              />
            ))}

            {unassignedDrafts.length > 0 && (
              <Select.Root
                collection={addPieceCollection}
                size="sm"
                onValueChange={(e) => {
                  const pieceId = e.value[0];
                  if (pieceId) addToIssue.mutate({ issueId: issue.id, pieceId });
                }}
              >
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="+ Add a draft to this Issue..." />
                  </Select.Trigger>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {addPieceCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            )}
          </VStack>

          {/* Craft editor for the selected piece — Draft Room's own components, reused directly */}
          <Box flex="1" minH="0" overflowY="auto">
            {!selectedPlacement ? (
              <Box display="flex" alignItems="center" justifyContent="center" h="100%">
                <Text color="fg.muted" fontSize="sm">
                  Select a piece to craft it.
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between" wrap="wrap">
                  <HStack gap={2}>
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette={selectedPlacement.spellcheck_clean ? "green" : "gray"}
                      disabled={revision === null || dirty || approvalPending || selectedPlacement.spellcheck_clean}
                      onClick={() => void runApproval(({ pieceId, revision: rev }) => reviewSpelling.mutateAsync({ pieceId, revision: rev }))}
                    >
                      <IconTextSpellcheck size={14} />
                      {selectedPlacement.spellcheck_clean ? "Spelling reviewed" : "Mark spelling reviewed"}
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette={selectedPlacement.signed_off ? "green" : "gray"}
                      disabled={revision === null || dirty || approvalPending || selectedPlacement.signed_off}
                      onClick={() => void runApproval(({ pieceId, revision: rev }) => signOffPiece.mutateAsync({ pieceId, revision: rev }))}
                    >
                      <IconCheck size={14} />
                      {selectedPlacement.signed_off ? "Signed off" : "Sign off"}
                    </Button>
                    {dirty && (
                      <Text fontSize="xs" color="fg.muted">
                        Saving draft before review...
                      </Text>
                    )}
                  </HStack>
                </HStack>

                <AtelierMetaTab
                  title={title}
                  onTitleChange={setTitle}
                  addressedTo={addressedTo}
                  onAddressedToChange={setAddressedTo}
                  onSave={() => {
                    void (async () => {
                      setSavingMeta(true);
                      try {
                        await axiosInstance.patch(`/api/writing/pieces/${selectedPlacement.piece_id}`, { title, addressed_to: addressedTo });
                      } finally {
                        setSavingMeta(false);
                      }
                    })();
                  }}
                  saving={savingMeta}
                  showAutoSaved={showAutoSaved}
                />

                <DraftRoomBodyEditor
                  key={selectedPlacement.piece_id}
                  pieceId={selectedPlacement.piece_id}
                  pieceSlug={selectedPlacement.piece_slug}
                  title={title}
                  published={false}
                  excerpt={excerpt}
                  onExcerptChange={setExcerpt}
                  onBodyLoaded={(_body: JSONContent, loadedExcerpt: string) => setExcerpt(loadedExcerpt)}
                  onBodyChange={() => setDirty(true)}
                  onRevisionChange={(rev) => {
                    setRevision(rev);
                    setDirty(false);
                  }}
                />

                <AtelierShapeTab
                  pieceId={selectedPlacement.piece_id}
                  initialTags={tags}
                  initialCategories={categories}
                  onTagsChange={setTags}
                  onCategoriesChange={setCategories}
                  pieceTitle={title}
                  authorDisplayName={sponsor.displayName}
                  onReadinessChange={(readiness) =>
                    setReadinessByPiece((current) => ({ ...current, [selectedPlacement.piece_id]: readiness }))
                  }
                  excerpt={excerpt}
                />
              </VStack>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

export default EditorsDeskMergedWorkArea;

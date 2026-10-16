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
// reorder, lead piece, sign-off, spellcheck, publish, and the read-model
// that carries per-piece excerpts) reuses the same useIssues/useIssue/
// useIssueRead hooks Editor's Desk uses. What's new here is only the
// orchestration gluing craft and assembly into one surface — Editor's
// Desk's own row/card/panel JSX is private to that file and unexported, so
// that presentation layer is necessarily rebuilt, not copied.
//
// Revised 2026-10-15 (CTO: "too mere... needs to be me-friendly... I want
// to see first sentences... Recency matters a lot"): titles were being
// clamped to a sliver by a too-narrow column; now full-width, two-line
// titles with a real excerpt per row (from useIssueRead's per-piece
// excerpt field), recency-sorted Issues, and an auto-selected most-recent
// piece so the craft pane is never a wall of empty space by default.
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
import { formatDistanceToNow } from "date-fns";
import {
  IconChevronDown,
  IconChevronUp,
  IconFilePlus,
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
import { useColorModeValue } from "@components/ui/color-mode";
import { useIssues, useIssue, useIssueRead } from "@mixtape/api/hooks/useIssueBoard";
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
  pieceCount,
  updatedAt,
  focused,
  cardBg,
  hoverBg,
  onClick,
  onDelete,
}: {
  title: string;
  status: string;
  pieceCount: number;
  updatedAt: string;
  focused: boolean;
  cardBg: string;
  hoverBg: string;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <Box
      px={3}
      py={2}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={focused ? `${ACCENT_COLOR}.400` : "border.muted"}
      bg={focused ? `${ACCENT_COLOR}.50` : cardBg}
      _dark={focused ? { bg: "whiteAlpha.100" } : undefined}
      _hover={focused ? undefined : { bg: hoverBg }}
      cursor="pointer"
      onClick={onClick}
    >
      <HStack justify="space-between" align="flex-start">
        <VStack align="stretch" gap={1} minW={0}>
          <Text fontSize="sm" fontWeight="bold" lineClamp={2}>
            {title}
          </Text>
          <HStack gap={2}>
            <Badge size="xs" variant="subtle">
              {status}
            </Badge>
            <Text fontSize="xs" color="fg.muted">
              {pieceCount} {pieceCount === 1 ? "piece" : "pieces"}
            </Text>
          </HStack>
          <Text fontSize="xs" color="fg.muted">
            Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
          </Text>
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
    </Box>
  );
}

function CreateIssueInline({ onCreate }: { onCreate: (title: string) => void }) {
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState("");

  if (!active) {
    return (
      <Button size="sm" variant="outline" colorScheme={ACCENT_COLOR} onClick={() => setActive(true)}>
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

/** A real card per piece: full title, an actual first-sentence excerpt, and
 * when it was last touched — not a sliver of truncated text in a thin row. */
function PlacementCard({
  placement,
  excerpt,
  lastActivity,
  index,
  total,
  selected,
  readiness,
  cardBg,
  hoverBg,
  onSelect,
  onMoveUp,
  onMoveDown,
  onSetLead,
  onRemove,
}: {
  placement: IssuePlacement;
  excerpt: string;
  lastActivity: string | null;
  index: number;
  total: number;
  selected: boolean;
  readiness?: CraftReadiness;
  cardBg: string;
  hoverBg: string;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetLead: () => void;
  onRemove: () => void;
}) {
  return (
    <Box
      borderRadius="lg"
      borderWidth="1px"
      borderColor={selected ? `${ACCENT_COLOR}.400` : "border.muted"}
      bg={selected ? `${ACCENT_COLOR}.50` : cardBg}
      _dark={selected ? { bg: "whiteAlpha.100" } : undefined}
      _hover={selected ? undefined : { bg: hoverBg }}
      cursor="pointer"
      p={3}
      onClick={onSelect}
    >
      <HStack justify="space-between" align="flex-start" mb={1}>
        <HStack gap={2} minW={0} align="flex-start">
          <Tooltip content={placement.is_lead ? "Unmark lead piece" : "Mark as lead piece"}>
            <IconButton
              aria-label="Toggle lead"
              size="2xs"
              variant="ghost"
              colorPalette={placement.is_lead ? "yellow" : "gray"}
              flexShrink={0}
              onClick={(e) => {
                e.stopPropagation();
                onSetLead();
              }}
            >
              {placement.is_lead ? <IconStarFilled size={14} /> : <IconStar size={14} />}
            </IconButton>
          </Tooltip>
          <Text fontSize="sm" fontWeight="semibold" lineClamp={2}>
            {placement.piece_title || "Untitled"}
          </Text>
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

      <Text fontSize="sm" color="fg.muted" lineClamp={2} mb={2} fontStyle={excerpt ? "normal" : "italic"}>
        {excerpt || "No content yet..."}
      </Text>

      <HStack gap={3} fontSize="xs" color="fg.muted" wrap="wrap">
        {lastActivity && <Text>Edited {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}</Text>}
        {placement.spellcheck_clean && (
          <HStack gap={1} color="green.600">
            <IconTextSpellcheck size={13} />
            <Text>Spelling reviewed</Text>
          </HStack>
        )}
        {placement.signed_off && (
          <HStack gap={1} color="green.600">
            <IconCheck size={13} />
            <Text>Signed off</Text>
          </HStack>
        )}
        <CraftReadinessDots readiness={readiness} />
      </HStack>
    </Box>
  );
}

export function EditorsDeskMergedWorkArea({ sponsor }: EditorsDeskMergedWorkAreaProps) {
  const cardBg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const { issues, createIssue, deleteIssue, addToIssue, removeFromIssue } = useIssues({ type: sponsor.type, slug: sponsor.slug });
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);
  const { issue, setPlacementLead, reorderPlacements, signOffPiece, reviewSpelling, publishIssue } = useIssue(focusedIssueId);
  const { data: issueRead } = useIssueRead(focusedIssueId);
  const { drafts, placements: publishedPlacements } = useWriting(sponsor.type, sponsor.slug);

  // Recency matters: the Issues rail leads with whatever was touched most
  // recently, and on first load (or whenever nothing is focused yet) we
  // jump straight into it rather than showing an empty "pick one" state.
  const issuesByRecency = useMemo(() => issues.slice().sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()), [issues]);

  useEffect(() => {
    if (focusedIssueId === null && issuesByRecency.length > 0) {
      setFocusedIssueId(issuesByRecency[0].id);
    }
  }, [focusedIssueId, issuesByRecency]);

  const placements = useMemo(() => issue?.placements ?? [], [issue]);
  const excerptByPieceId = useMemo(() => {
    const map: Record<string, string> = {};
    (issueRead?.placements ?? []).forEach((p) => {
      map[p.id] = p.excerpt || "";
    });
    return map;
  }, [issueRead]);

  // Real recency per piece — the same two sources Reception reads, cross-
  // referenced here instead of the publish-order index.
  const lastActivityByPieceId = useMemo(() => {
    const map: Record<string, string> = {};
    drafts.forEach((d) => {
      map[d.piece.id] = d.last_saved_at || d.piece.updated_at || d.piece.created_at;
    });
    publishedPlacements.forEach((p) => {
      if (!map[p.piece_id]) map[p.piece_id] = p.updated_at || p.published_at || p.created_at;
    });
    return map;
  }, [drafts, publishedPlacements]);

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

  // Auto-select the most recently active piece whenever the focused Issue's
  // placements change and nothing valid is currently selected — this is
  // what keeps the craft pane from defaulting to a wall of empty space.
  useEffect(() => {
    if (placements.length === 0) {
      setSelectedPieceId(null);
      return;
    }
    if (placements.some((p) => p.piece_id === selectedPieceId)) return;
    const mostRecent = placements.slice().sort((a, b) => {
      const ta = lastActivityByPieceId[a.piece_id] ? new Date(lastActivityByPieceId[a.piece_id]).getTime() : 0;
      const tb = lastActivityByPieceId[b.piece_id] ? new Date(lastActivityByPieceId[b.piece_id]).getTime() : 0;
      return tb - ta;
    })[0];
    setSelectedPieceId(mostRecent.piece_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placements]);

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
    setExcerpt(excerptByPieceId[selectedPlacement.piece_id] || "");
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

  const focusedIssueSummary = issue
    ? `${placements.length} ${placements.length === 1 ? "piece" : "pieces"}${
        placements.filter((p) => p.signed_off).length ? ` — ${placements.filter((p) => p.signed_off).length} signed off` : ""
      }`
    : "";

  return (
    <Box display="flex" gap={4} h="100%" minH="0" maxW="1400px">
      {/* Issue rail — recency-sorted */}
      <VStack align="stretch" gap={2} minW="240px" maxW="240px" borderRight="1px solid" borderColor="border.muted" pr={3} overflowY="auto">
        <Heading size="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
          Issues
        </Heading>
        {issuesByRecency.map((i) => (
          <IssueRailCard
            key={i.id}
            title={i.title}
            status={i.status}
            pieceCount={i.piece_ids.length}
            updatedAt={i.updated_at}
            focused={i.id === focusedIssueId}
            cardBg={cardBg}
            hoverBg={hoverBg}
            onClick={() => setFocusedIssueId(i.id)}
            onDelete={() => {
              deleteIssue.mutate(i.id, { onSuccess: () => { if (focusedIssueId === i.id) setFocusedIssueId(null); } });
            }}
          />
        ))}
        <CreateIssueInline onCreate={(t) => createIssue.mutate(t)} />
      </VStack>

      {!issue ? (
        <Box flex="1" display="flex" alignItems="center" justifyContent="center">
          <VStack gap={2}>
            <IconFilePlus size={28} color="var(--chakra-colors-fg-muted)" />
            <Text color="fg.muted" fontSize="sm">
              Create an Issue to start crafting.
            </Text>
          </VStack>
        </Box>
      ) : (
        <>
          {/* Placement cards */}
          <VStack align="stretch" gap={2} minW="340px" maxW="340px" borderRight="1px solid" borderColor="border.muted" pr={3} overflowY="auto">
            <HStack justify="space-between" align="flex-start">
              <VStack align="stretch" gap={0}>
                <Heading size="sm" lineClamp={1}>
                  {issue.title}
                </Heading>
                <Text fontSize="xs" color="fg.muted">
                  {focusedIssueSummary}
                </Text>
              </VStack>
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
              <PlacementCard
                key={p.id}
                placement={p}
                excerpt={excerptByPieceId[p.piece_id] || ""}
                lastActivity={lastActivityByPieceId[p.piece_id] ?? null}
                index={index}
                total={placements.length}
                selected={p.piece_id === selectedPieceId}
                readiness={readinessByPiece[p.piece_id]}
                cardBg={cardBg}
                hoverBg={hoverBg}
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

            {placements.length === 0 && (
              <Text fontSize="sm" color="fg.muted" fontStyle="italic">
                No pieces yet — add one below.
              </Text>
            )}

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
                <VStack gap={2}>
                  <IconFilePlus size={28} color="var(--chakra-colors-fg-muted)" />
                  <Text color="fg.muted" fontSize="sm">
                    Add a piece to this Issue to start crafting it.
                  </Text>
                </VStack>
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

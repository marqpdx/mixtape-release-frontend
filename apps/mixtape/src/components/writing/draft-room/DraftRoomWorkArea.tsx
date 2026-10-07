// apps/mixtape/src/components/writing/draft-room/DraftRoomWorkArea.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  Badge,
  Box,
  Button,
  Grid,
  HStack,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
// import { Tooltip } from "@components/ui/tooltip";
import { HelpTip } from "@/components/help/HelpTip";
import { useHelpRegistration } from "@/components/help/useHelpRegistration";
import { useWriting } from "@hooks/useWriting";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { Tag } from "@components/writing/composer/TagInput";
import { Category } from "@components/writing/composer/CategoryInput";
import { SimplePublishDialog } from "@components/writing/composer/SimplePublishDialog";
import { formatDistanceToNow } from "date-fns";
import { Divider } from "@/components/common/Divider";
import { IconPencil } from "@tabler/icons-react";
import { Tooltip } from "@components/ui/tooltip";
import AtelierShapeTab from "./AtelierShapeTab";
import AtelierMetaTab from "./AtelierMetaTab";
import DraftRoomBodyEditor from "./DraftRoomBodyEditor";
import { CraftReadinessDots, type CraftReadiness } from "./CraftReadinessDots";

type SponsorConfig = {
  type: "member" | "group";
  id: string;
  slug: string;
  displayName: string;
};

interface DraftRoomWorkAreaProps {
  sponsor: SponsorConfig;
  setActiveSection: (section: string, params?: Record<string, string>) => void;
}

type PieceDetail = {
  id: string;
  slug: string;
  title?: string;
  excerpt?: string;
  writing_kind?: string;
  body_json?: Record<string, unknown> | null;
};

type MetadataSnapshot = {
  title: string;
  addressedTo: string;
  tagIds: string[];
  categoryIds: string[];
};

function previewFromBody(body: unknown): string[] {
  const paragraphs: string[] = [];
  const inlineText = (node: unknown): string => {
    if (!node || typeof node !== "object") return "";
    const value = node as { type?: string; text?: string; content?: unknown[] };
    if (value.type === "text") return value.text || "";
    if (value.type === "hardBreak") return "\n";
    return (value.content || []).map(inlineText).join("");
  };
  const visit = (node: unknown) => {
    if (paragraphs.length >= 2 || !node || typeof node !== "object") return;
    const value = node as { type?: string; content?: unknown[] };
    if (value.type === "paragraph") {
      const paragraph = inlineText(value).trim();
      if (paragraph) paragraphs.push(paragraph.slice(0, 900));
      return;
    }
    (value.content || []).forEach(visit);
  };
  visit(body);
  return paragraphs;
}

function PiecePreview({ title, paragraphs, children }: {
  title: string;
  paragraphs: string[];
  children: ReactElement;
}) {
  return (
    <Tooltip
      disabled={paragraphs.length === 0}
      openDelay={300}
      positioning={{ placement: "right-start" }}
      contentProps={{ maxW: "min(420px, calc(100vw - 32px))", maxH: "320px", overflowY: "auto", p: 3, bg: "theme.bg", color: "theme.text", borderWidth: "1px", borderColor: "theme.border", boxShadow: "lg" }}
      content={
        <VStack align="stretch" gap="5px">
          <Text fontSize="sm" fontWeight="600" mb={2}>{title}</Text>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} fontSize="sm" lineHeight="1.5" whiteSpace="pre-line">{paragraph}</Text>
          ))}
        </VStack>
      }
    >
      {children}
    </Tooltip>
  );
}

export default function DraftRoomWorkArea({
  sponsor,
  setActiveSection,
}: DraftRoomWorkAreaProps) {
  useHelpRegistration("DraftRoomWorkArea");
  const [activeTab, setActiveTab] = useState("drafts");
  const [rightTab, setRightTab] = useState<"meta" | "shape">("shape");
  const [selectedPieceId, setSelectedPieceId] = useState<string | undefined>();
  const [selectedPieceSlug, setSelectedPieceSlug] = useState<string | undefined>();
  const [pieceDetail, setPieceDetail] = useState<PieceDetail | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [addressedTo, setAddressedTo] = useState("");
  const [showTitleSaved, setShowTitleSaved] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [bodyReady, setBodyReady] = useState(false);
  const [metadataError, setMetadataError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [showAutoSaved, setShowAutoSaved] = useState(false);
  const [listReadiness, setListReadiness] = useState<Record<string, CraftReadiness>>({});

  const textSecondary = useColorModeValue("gray.600", "gray.300");
  const panelBg = useColorModeValue("gray.50", "gray.900");
  const panelBorder = useColorModeValue("gray.200", "gray.700");
  const itemHover = useColorModeValue("gray.100", "gray.800");

  const {
    placements,
    drafts,
    isLoading: placementsLoading,
    draftsLoading,
    showSolo,
    showCollab,
    setShowSolo,
    setShowCollab,
  } = useWriting(sponsor.type, sponsor.slug);
  void showSolo;
  void showCollab;
  void setShowSolo;
  void setShowCollab;

  const titleRef = useRef<string>("");
  const docJSONRef = useRef<Record<string, unknown> | null>(null);
  const [excerpt, setExcerpt] = useState<string>("");
  // SimplePublishDialog still reads excerpt via a ref prop; mirror state into
  // it below rather than changing that contract.
  const excerptRef = useRef<string>("");
  excerptRef.current = excerpt;
  const hydratingMetadataRef = useRef(false);
  const lastSavedSnapshotRef = useRef<MetadataSnapshot | null>(null);
  const failedSnapshotRef = useRef<MetadataSnapshot | null>(null);
  const autosaveTimeoutRef = useRef<number | null>(null);

  const draftItems = useMemo(() => (Array.isArray(drafts) ? drafts : []), [drafts]);
  const publishedItems = useMemo(
    () => (Array.isArray(placements) ? placements : []),
    [placements]
  );
  const listPieceIds = useMemo(() => Array.from(new Set([
    ...draftItems.map((draft) => draft.piece?.id).filter((id): id is string => Boolean(id)),
    ...publishedItems.map((placement) => placement.piece_id).filter((id): id is string => Boolean(id)),
  ])).sort().join(","), [draftItems, publishedItems]);

  useEffect(() => {
    if (!listPieceIds) {
      setListReadiness({});
      return;
    }
    let active = true;
    const ids = listPieceIds.split(",");
    const batches = Array.from({ length: Math.ceil(ids.length / 100) }, (_, index) => ids.slice(index * 100, (index + 1) * 100));
    void Promise.all(batches.map((batch) =>
      axiosInstance.get<Record<string, CraftReadiness>>("/api/atelier/readiness/batch/", { params: { ids: batch.join(",") } })
    )).then((responses) => {
      if (active) setListReadiness(Object.assign({}, ...responses.map((response) => response.data)));
    }).catch(() => {
      if (active) setListReadiness({});
    });
    return () => { active = false; };
  }, [listPieceIds]);

  const handleReadinessChange = useCallback((readiness: CraftReadiness) => {
    if (selectedPieceId) setListReadiness((current) => ({ ...current, [selectedPieceId]: readiness }));
  }, [selectedPieceId]);

  const isDraftsTab = activeTab === "drafts";
  const isLoading = isDraftsTab ? draftsLoading : placementsLoading;

  const persistAddressedTo = (value: string) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("writing_addressed_to_default", value);
    } catch {
      // ignore
    }
  };

  const getPersistedAddressedTo = (): string => {
    if (typeof window === "undefined") return "public";
    try {
      return window.localStorage.getItem("writing_addressed_to_default") || "public";
    } catch {
      return "public";
    }
  };

  const toIdList = useCallback(
    (ids: Array<string | number | undefined>) =>
      ids
        .filter((id): id is string | number => id !== undefined && id !== null)
        .map((id) => String(id))
        .sort(),
    []
  );

  const handleBodyLoaded = useCallback((body: Record<string, unknown>, loadedExcerpt: string) => {
    docJSONRef.current = body;
    setExcerpt(loadedExcerpt);
    setBodyReady(true);
  }, []);

  const handleBodyChange = useCallback((body: Record<string, unknown>) => {
    docJSONRef.current = body;
  }, []);

  useEffect(() => {
    hydratingMetadataRef.current = true;
    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
    setLoadError("");
    setMetadataError("");
    failedSnapshotRef.current = null;
    if (!selectedPieceId) {
      setPieceDetail(null);
      setTags([]);
      setCategories([]);
      setTitle("");
      setAddressedTo(getPersistedAddressedTo());
      setShowTitleSaved(false);
      lastSavedSnapshotRef.current = null;
      hydratingMetadataRef.current = false;
      return;
    }
    let mounted = true;
    axiosInstance
      .get(`/api/writing/pieces/${selectedPieceId}`)
      .then((res) => {
        if (!mounted) return;
        const detail = res.data as PieceDetail;
        setPieceDetail(detail);
        setTitle(detail.title || "");
        const persisted = getPersistedAddressedTo();
        setAddressedTo((detail as { addressed_to?: string }).addressed_to || persisted);
        titleRef.current = detail.title || "";
        lastSavedSnapshotRef.current = {
          title: (detail.title || "").trim(),
          addressedTo: (detail as { addressed_to?: string }).addressed_to || persisted,
          tagIds: [],
          categoryIds: [],
        };
      })
      .catch(() => {
        if (!mounted) return;
        setPieceDetail(null);
        setTitle("");
        setLoadError("Could not load piece details. Check your access and try selecting it again.");
        hydratingMetadataRef.current = false;
      });
    return () => {
      mounted = false;
    };
  }, [selectedPieceId]);

  useEffect(() => {
    if (!selectedPieceId) {
      setTags([]);
      setCategories([]);
      hydratingMetadataRef.current = false;
      return;
    }
    hydratingMetadataRef.current = true;
    let mounted = true;
    Promise.all([
      axiosInstance
        .get(`/api/writing/pieces/${selectedPieceId}/tags`)
        .then((res) => res.data || [])
        .catch(() => []),
      axiosInstance
        .get(`/api/writing/pieces/${selectedPieceId}/categories`)
        .then((res) => res.data || [])
        .catch(() => []),
    ]).then(([nextTags, nextCategories]) => {
      if (!mounted) return;
      setTags(nextTags);
      setCategories(nextCategories);
      lastSavedSnapshotRef.current = {
        title: (titleRef.current || "").trim(),
        addressedTo: addressedTo || getPersistedAddressedTo(),
        tagIds: toIdList(nextTags.map((tag: Tag) => tag.id)),
        categoryIds: toIdList(nextCategories.map((category: Category) => category.id)),
      };
      hydratingMetadataRef.current = false;
    });

    return () => {
      mounted = false;
    };
  }, [selectedPieceId, addressedTo, toIdList]);

  const handleTagsChange = (newTags: Tag[]) => {
    setTags(newTags);
  };

  const handleCategoriesChange = (newCategories: Category[]) => {
    setCategories(newCategories);
  };

  const handleSaveMetadata = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!pieceDetail?.id) return;
      setSavingMeta(true);
      try {
        await axiosInstance.patch(`/api/writing/pieces/${pieceDetail.id}`, {
          title,
          addressed_to: addressedTo || "public",
        });
        titleRef.current = title;
        if (!silent) {
          setShowTitleSaved(true);
          setTimeout(() => setShowTitleSaved(false), 2750);
        } else {
          setShowAutoSaved(true);
          setTimeout(() => setShowAutoSaved(false), 2750);
        }
        await axiosInstance.put(`/api/writing/pieces/${pieceDetail.id}/tags`, {
          tag_ids: toIdList(tags.map((tag) => tag.id)),
        });
        await axiosInstance.put(`/api/writing/pieces/${pieceDetail.id}/categories`, {
          category_ids: toIdList(categories.map((category) => category.id)),
        });
        persistAddressedTo(addressedTo || "public");
        lastSavedSnapshotRef.current = {
          title: title.trim(),
          addressedTo: addressedTo || "public",
          tagIds: toIdList(tags.map((tag) => tag.id)),
          categoryIds: toIdList(categories.map((category) => category.id)),
        };
        failedSnapshotRef.current = null;
        setMetadataError("");
      } catch {
        failedSnapshotRef.current = {
          title: title.trim(),
          addressedTo: addressedTo || "public",
          tagIds: toIdList(tags.map((tag) => tag.id)),
          categoryIds: toIdList(categories.map((category) => category.id)),
        };
        setMetadataError("Could not save metadata. Your changes are still here; please retry.");
      } finally {
        setSavingMeta(false);
      }
    },
    [pieceDetail?.id, title, addressedTo, tags, categories, toIdList]
  );

  const metadataSnapshot = useMemo<MetadataSnapshot>(
    () => ({
      title: title.trim(),
      addressedTo: addressedTo || "public",
      tagIds: toIdList(tags.map((tag) => tag.id)),
      categoryIds: toIdList(categories.map((category) => category.id)),
    }),
    [title, addressedTo, tags, categories, toIdList]
  );

  const snapshotEquals = useCallback((a: MetadataSnapshot | null, b: MetadataSnapshot) => {
    if (!a) return false;
    return (
      a.title === b.title &&
      a.addressedTo === b.addressedTo &&
      a.tagIds.join("|") === b.tagIds.join("|") &&
      a.categoryIds.join("|") === b.categoryIds.join("|")
    );
  }, []);

  useEffect(() => {
    if (!selectedPieceId || !pieceDetail?.id) return;
    if (savingMeta) return;
    if (hydratingMetadataRef.current) return;
    if (snapshotEquals(lastSavedSnapshotRef.current, metadataSnapshot)) return;
    if (snapshotEquals(failedSnapshotRef.current, metadataSnapshot)) return;
    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }
    autosaveTimeoutRef.current = window.setTimeout(() => {
      void handleSaveMetadata({ silent: true });
    }, 2500);
    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }
    };
  }, [metadataSnapshot, selectedPieceId, pieceDetail?.id, savingMeta, handleSaveMetadata, snapshotEquals]);

  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  // const isTagsReady = tags.length > 0 || noneOkTags;
  // const isCategoriesReady = categories.length > 0 || noneOkCategories;
  // const isSeriesReady = Boolean(series.trim()) || noneOkSeries;

  return (
    <Grid
      className="drwa-root"
      templateColumns={{ base: "minmax(0, 1fr)", xl: selectedPieceId ? "minmax(0, 19.5fr) minmax(0, 53.5fr) minmax(0, 27fr)" : "minmax(0, 35fr) minmax(0, 65fr)" }}
      alignItems="stretch"
      gap={4}
      w="100%"
    >
      <Box
        className="drwa-piece-list"
        minW={0}
        borderWidth="1px"
        borderColor={panelBorder}
        bg={panelBg}
        borderRadius="lg"
        p={4}
        minH="70vh"
      >
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <HStack gap={2}>
              <Text fontSize="lg" fontWeight="semibold">
                Draft Room
              </Text>
              <HelpTip helpKey="writing-overview" />
            </HStack>
            <Button size="sm" onClick={() => { setSelectedPieceId(undefined); setSelectedPieceSlug(undefined); }}>
              List
            </Button>
          </HStack>

          <Tabs.Root
            value={activeTab}
            onValueChange={(details) => {
              setActiveTab(details.value);
              setSelectedPieceId(undefined);
              setSelectedPieceSlug(undefined);
            }}
          >
            <Tabs.List>
              <Tabs.Trigger value="drafts">Drafts</Tabs.Trigger>
              <Tabs.Trigger value="published">Published</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>

          <Divider />

          {isLoading && (
            <Text fontSize="sm" color={textSecondary}>
              Loading…
            </Text>
          )}

          {!isLoading && isDraftsTab && draftItems.length === 0 && (
            <Text fontSize="sm" color={textSecondary}>
              No drafts yet. Start a new draft.
            </Text>
          )}

          {!isLoading && !isDraftsTab && publishedItems.length === 0 && (
            <Text fontSize="sm" color={textSecondary}>
              No published pieces yet.
            </Text>
          )}

          <VStack align="stretch" gap={2} maxH="60vh" overflowY="auto">
            {isDraftsTab &&
              draftItems.map((draft) => {
                const preview = draft.preview_paragraphs?.length
                  ? draft.preview_paragraphs
                  : draft.body_preview ? [draft.body_preview] : [];
                return <PiecePreview key={draft.id} title={draft.title || "Untitled draft"} paragraphs={preview}>
                <Box
                  className="drwa-draft-card"
                  p={3}
                  borderWidth="1px"
                  borderColor={selectedPieceId === draft.piece.id ? "green.500" : panelBorder}
                  borderRadius="md"
                  bg={selectedPieceId === draft.piece.id ? "green.50" : undefined}
                  _dark={selectedPieceId === draft.piece.id ? { bg: "green.900" } : undefined}
                  cursor="pointer"
                  _hover={{ bg: selectedPieceId === draft.piece.id ? undefined : itemHover }}
                  onClick={() => {
                    const draftSlug = draft.piece.slug || draft.piece.id;
                    const draftTitle = draft.title || draft.piece.title || "";
                    docJSONRef.current = null;
                    setBodyReady(false);
                    setRightTab("shape");
                    setSelectedPieceId(draft.piece.id);
                    setSelectedPieceSlug(draftSlug);
                    setTitle(draftTitle);
                    setPieceDetail({
                      id: draft.piece.id,
                      slug: draftSlug,
                      title: draftTitle,
                    });
                  }}
                >
                  <Text fontWeight="medium">
                    {draft.title || "Untitled draft"}
                  </Text>
                  <Text fontSize="sm" color={textSecondary}>
                    Edited {formatDistanceToNow(new Date(draft.last_saved_at))} ago
                  </Text>
                  {!selectedPieceId && preview[0] && (
                    <Text fontSize="sm" color={textSecondary} mt={1} lineClamp={2}>
                      {preview[0]}
                    </Text>
                  )}
                  <Box mt={2}><CraftReadinessDots readiness={listReadiness[draft.piece.id]} /></Box>
                </Box>
                </PiecePreview>;
              })}

            {!isDraftsTab &&
              publishedItems.map((placement) => {
                const preview = previewFromBody(placement.display?.body_json ?? placement.piece_body_json);
                return <PiecePreview key={placement.id} title={placement.piece_title} paragraphs={preview}>
                <Box
                  className="drwa-published-card"
                  p={3}
                  borderWidth="1px"
                  borderColor={selectedPieceId === placement.piece_id ? "green.500" : panelBorder}
                  borderRadius="md"
                  bg={selectedPieceId === placement.piece_id ? "green.50" : undefined}
                  _dark={selectedPieceId === placement.piece_id ? { bg: "green.900" } : undefined}
                  cursor="pointer"
                  _hover={{ bg: selectedPieceId === placement.piece_id ? undefined : itemHover }}
                  onClick={() => {
                    docJSONRef.current = null;
                    setBodyReady(false);
                    setRightTab("shape");
                    setSelectedPieceId(placement.piece_id);
                    setSelectedPieceSlug(placement.piece_slug);
                    setTitle(placement.piece_title);
                    setPieceDetail(null);
                  }}
                >
                  <HStack justify="space-between">
                    <Text fontWeight="medium">{placement.piece_title}</Text>
                    <Badge size="sm" variant="outline">
                      Published
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color={textSecondary}>
                    {placement.published_at
                      ? `Published ${formatDistanceToNow(
                          new Date(placement.published_at)
                        )} ago`
                      : "Published"}
                  </Text>
                  {!selectedPieceId && preview[0] && (
                    <Text fontSize="sm" color={textSecondary} mt={1} lineClamp={2}>{preview[0]}</Text>
                  )}
                  <Box mt={2}><CraftReadinessDots readiness={listReadiness[placement.piece_id]} /></Box>
                </Box>
                </PiecePreview>;
              })}
          </VStack>
        </VStack>
      </Box>

      {selectedPieceId && selectedPieceSlug && (
        <Box
          className="drwa-body-pane"
          minW={0}
          minH="70vh"
          borderWidth="1px"
          borderColor={panelBorder}
          borderRadius="lg"
          p={4}
        >
          <DraftRoomBodyEditor
            key={selectedPieceId}
            pieceId={selectedPieceId}
            pieceSlug={selectedPieceSlug}
            title={title}
            published={!isDraftsTab}
            excerpt={excerpt}
            onExcerptChange={setExcerpt}
            onBodyLoaded={handleBodyLoaded}
            onBodyChange={handleBodyChange}
          />
        </Box>
      )}

      <Box
        className="drwa-details-pane"
        minW={0}
        borderWidth="1px"
        borderColor={panelBorder}
        borderRadius="lg"
        p={4}
        minH="70vh"
      >
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <HStack gap={2}>
              <Text fontSize="lg" fontWeight="semibold">
                Details
              </Text>
              <HelpTip helpKey="writing-overview" />
            </HStack>
            {selectedPieceId && (
              <HStack gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Edit content"
                  title="Edit content"
                  onClick={() => setActiveSection("write", { piece: selectedPieceId, returnTo: "draft-room" })}
                >
                  <IconPencil size={16} />
                </Button>
                {isDraftsTab && (
                  <Button size="sm" variant="outline" disabled={!bodyReady || !pieceDetail} onClick={() => setDialogOpen(true)}>
                    Publish…
                  </Button>
                )}
              </HStack>
            )}
          </HStack>

          {!selectedPieceId && (
            <Text fontSize="sm" color={textSecondary}>
              Select a draft from the left panel.
            </Text>
          )}

          {loadError && <Text fontSize="sm" color="red.600">{loadError}</Text>}
          {metadataError && <Text fontSize="sm" color="red.600">{metadataError}</Text>}

          {selectedPieceId && (
            <>
              <Tabs.Root
                className="drwa-details-tabs"
                value={rightTab}
                onValueChange={(d) => setRightTab(d.value as "meta" | "shape")}
              >
                <Tabs.List>
                  <Tabs.Trigger value="shape">Shape</Tabs.Trigger>
                  <Tabs.Trigger value="meta">Meta</Tabs.Trigger>
                </Tabs.List>
              </Tabs.Root>

              <Divider />

              {rightTab === "meta" && (
                <AtelierMetaTab
                  title={title}
                  onTitleChange={setTitle}
                  addressedTo={addressedTo}
                  onAddressedToChange={(value) => {
                    setAddressedTo(value);
                    persistAddressedTo(value);
                  }}
                  onSave={() => { void handleSaveMetadata(); }}
                  saving={savingMeta}
                  saveDisabled={!pieceDetail}
                  showTitleSaved={showTitleSaved}
                  showAutoSaved={showAutoSaved}
                />
              )}

              {rightTab === "shape" && selectedPieceSlug && (
                <AtelierShapeTab
                  pieceId={selectedPieceId}
                  initialTags={tags}
                  initialCategories={categories}
                  onTagsChange={handleTagsChange}
                  onCategoriesChange={handleCategoriesChange}
                  pieceTitle={title}
                  writingKind={pieceDetail?.writing_kind}
                  authorDisplayName={sponsor.displayName}
                  onReadinessChange={handleReadinessChange}
                  excerpt={excerpt}
                />
              )}
            </>
          )}
        </VStack>
      </Box>

      {pieceDetail && (
        <SimplePublishDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          piece={{ id: pieceDetail.id, title: pieceDetail.title || "" }}
          pieceSlug={selectedPieceSlug}
          sponsorId={sponsor.id}
          sponsorSlug={sponsor.slug}
          sponsorType={sponsor.type}
          titleRef={titleRef}
          docJSONRef={docJSONRef}
          excerptRef={excerptRef}
          isUpdate={false}
          onPublished={() => setDialogOpen(false)}
        />
      )}
    </Grid>
  );
}

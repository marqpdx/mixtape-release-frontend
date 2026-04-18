// apps/mixtape/src/components/writing/draft-room/DraftRoomWorkArea.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  HStack,
  Input,
  Portal,
  Select,
  Tabs,
  Text,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { Tooltip } from "@components/ui/tooltip";
import { HelpTip } from "@/components/help/HelpTip";
import { useHelpRegistration } from "@/components/help/useHelpRegistration";
import { useWriting } from "@hooks/useWriting";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { TagInput, Tag } from "@components/writing/composer/TagInput";
import { CategoryInput, Category } from "@components/writing/composer/CategoryInput";
import { SimplePublishDialog } from "@components/writing/composer/SimplePublishDialog";
import { formatDistanceToNow } from "date-fns";
import { Divider } from "@/components/common/Divider";
import AtelierShapeTab from "./AtelierShapeTab";

type SponsorConfig = {
  type: "member";
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
  body_json?: Record<string, unknown> | null;
};

type MetadataSnapshot = {
  title: string;
  addressedTo: string;
  tagIds: string[];
  categoryIds: string[];
};

export default function DraftRoomWorkArea({
  sponsor,
  setActiveSection,
}: DraftRoomWorkAreaProps) {
  useHelpRegistration("DraftRoomWorkArea");
  const [activeTab, setActiveTab] = useState("drafts");
  const [rightTab, setRightTab] = useState<"meta" | "shape">("meta");
  const [selectedPieceId, setSelectedPieceId] = useState<string | undefined>();
  const [selectedPieceSlug, setSelectedPieceSlug] = useState<string | undefined>();
  const [pieceDetail, setPieceDetail] = useState<PieceDetail | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [addressedTo, setAddressedTo] = useState("");
  const [series, setSeries] = useState("");
  const [noneOkTags, setNoneOkTags] = useState(false);
  const [noneOkCategories, setNoneOkCategories] = useState(false);
  const [noneOkSeries, setNoneOkSeries] = useState(false);
  const [showTitleSaved, setShowTitleSaved] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [showAutoSaved, setShowAutoSaved] = useState(false);

  const textSecondary = useColorModeValue("gray.600", "gray.300");
  const panelBg = useColorModeValue("gray.50", "gray.900");
  const panelBorder = useColorModeValue("gray.200", "gray.700");
  const itemHover = useColorModeValue("gray.100", "gray.800");
  const inputBg = useColorModeValue("gray.50", "gray.900");
  const inputBorder = useColorModeValue("gray.200", "gray.700");
  const inputFocusBorder = useColorModeValue("blue.400", "blue.300");
  const selectCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Crossroads community", value: "crossroads" },
          { label: "Public", value: "public" },
          { label: "Myself", value: "self" },
        ],
      }),
    []
  );

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
  const excerptRef = useRef<string>("");
  const hydratingMetadataRef = useRef(false);
  const lastSavedSnapshotRef = useRef<MetadataSnapshot | null>(null);
  const autosaveTimeoutRef = useRef<number | null>(null);

  const draftItems = useMemo(() => (Array.isArray(drafts) ? drafts : []), [drafts]);
  const publishedItems = useMemo(
    () => (Array.isArray(placements) ? placements : []),
    [placements]
  );

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

  useEffect(() => {
    hydratingMetadataRef.current = true;
    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
    if (!selectedPieceSlug) {
      setPieceDetail(null);
      setTags([]);
      setCategories([]);
      setTitle("");
      setAddressedTo(getPersistedAddressedTo());
      setSeries("");
      setNoneOkTags(false);
      setNoneOkCategories(false);
      setNoneOkSeries(false);
      setShowTitleSaved(false);
      lastSavedSnapshotRef.current = null;
      hydratingMetadataRef.current = false;
      return;
    }
    let mounted = true;
    axiosInstance
      .get(`/api/writing/pieces/${selectedPieceSlug}`)
      .then((res) => {
        if (!mounted) return;
        const detail = res.data as PieceDetail;
        setPieceDetail(detail);
        setTitle(detail.title || "");
        const persisted = getPersistedAddressedTo();
        setAddressedTo((detail as { addressed_to?: string }).addressed_to || persisted);
        titleRef.current = detail.title || "";
        excerptRef.current = detail.excerpt || "";
        docJSONRef.current = (detail.body_json || null) as Record<
          string,
          unknown
        > | null;
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
        hydratingMetadataRef.current = false;
      });
    return () => {
      mounted = false;
    };
  }, [selectedPieceSlug]);

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
        await axiosInstance.patch(`/api/writing/pieces/${pieceDetail.slug}`, {
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
      } finally {
        setSavingMeta(false);
      }
    },
    [pieceDetail?.id, pieceDetail?.slug, title, addressedTo, tags, categories, toIdList]
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

  const readinessColor = (isReady: boolean) => (isReady ? "green.400" : "orange.400");
  const isTitleReady = Boolean(title.trim());
  const isAudienceReady = Boolean(addressedTo.trim());
  const isTagsReady = tags.length > 0 || noneOkTags;
  const isCategoriesReady = categories.length > 0 || noneOkCategories;
  const isSeriesReady = Boolean(series.trim()) || noneOkSeries;

  return (
    <HStack align="stretch" gap={6} w="100%">
      <Box
        w={{ base: "100%", lg: "35%" }}
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
            <Button size="sm" onClick={() => setSelectedPieceId(undefined)}>
              New draft
            </Button>
          </HStack>

          <Tabs.Root
            value={activeTab}
            onValueChange={(details) => setActiveTab(details.value)}
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
              draftItems.map((draft) => (
                <Box
                  key={draft.id}
                  p={3}
                  borderWidth="1px"
                  borderColor={panelBorder}
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: itemHover }}
                  onClick={() => {
                    const draftSlug = draft.piece.slug || draft.piece.id;
                    const draftTitle = draft.title || draft.piece.title || "";
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
                </Box>
              ))}

            {!isDraftsTab &&
              publishedItems.map((placement) => (
                <Box
                  key={placement.id}
                  p={3}
                  borderWidth="1px"
                  borderColor={panelBorder}
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: itemHover }}
                  onClick={() => {
                    setSelectedPieceId(placement.piece_id);
                    setSelectedPieceSlug(placement.piece_slug);
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
                </Box>
              ))}
          </VStack>
        </VStack>
      </Box>

      <Box
        w={{ base: "100%", lg: "65%" }}
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
                Draft Room
              </Text>
              <HelpTip helpKey="writing-overview" />
            </HStack>
            {selectedPieceId && (
              <HStack gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveSection("write", { piece: selectedPieceId })}
                >
                  Edit content
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                  Publish…
                </Button>
              </HStack>
            )}
          </HStack>

          {!selectedPieceId && (
            <Text fontSize="sm" color={textSecondary}>
              Select a draft from the left panel.
            </Text>
          )}

          {selectedPieceId && (
            <>
              <Tabs.Root
                value={rightTab}
                onValueChange={(d) => setRightTab(d.value as "meta" | "shape")}
              >
                <Tabs.List>
                  <Tabs.Trigger value="meta">Meta</Tabs.Trigger>
                  <Tabs.Trigger value="shape">Shape</Tabs.Trigger>
                </Tabs.List>
              </Tabs.Root>

              <Divider />

              {rightTab === "meta" && (
                <VStack align="stretch" gap={4}>
                  <Box>
                    <HStack align="center" gap={3} mb={2}>
                      <Box w="8px" h="8px" borderRadius="full" bg={readinessColor(isTitleReady)} />
                      <Text fontSize="sm" fontWeight="medium">
                        Title
                      </Text>
                      <Input
                        size="sm"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Untitled"
                        bg={inputBg}
                        borderColor={inputBorder}
                        _focus={{ borderColor: inputFocusBorder }}
                        flex="1"
                      />
                      {showTitleSaved && (
                        <Text fontSize="xs" color={textSecondary}>saved</Text>
                      )}
                      {showAutoSaved && (
                        <Text fontSize="xs" color={textSecondary}>autosaved</Text>
                      )}
                    </HStack>
                  </Box>

                  <Box>
                    <HStack align="center" gap={3} mb={2}>
                      <Box w="8px" h="8px" borderRadius="full" bg={readinessColor(isAudienceReady)} />
                      <Text fontSize="sm" fontWeight="medium">Audience</Text>
                    </HStack>
                    <Select.Root
                      collection={selectCollection}
                      value={addressedTo ? [addressedTo] : []}
                      onValueChange={({ value }) => {
                        const nextValue = value[0] ?? "public";
                        setAddressedTo(nextValue);
                        persistAddressedTo(nextValue);
                      }}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder="Select audience" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                          <Select.ClearTrigger />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {selectCollection.items.map((item) => (
                              <Select.Item item={item} key={item.value}>
                                {item.label}
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Box>

                  <Divider />

                  <HStack justify="flex-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { void handleSaveMetadata(); }}
                      disabled={savingMeta}
                    >
                      {savingMeta ? "Saving..." : "Save"}
                    </Button>
                  </HStack>
                </VStack>
              )}

              {rightTab === "shape" && selectedPieceSlug && (
                <AtelierShapeTab
                  pieceSlug={selectedPieceSlug}
                  pieceId={selectedPieceId}
                  initialTags={tags}
                  initialCategories={categories}
                  onTagsChange={handleTagsChange}
                  onCategoriesChange={handleCategoriesChange}
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
    </HStack>
  );
}

// apps/mixtape/src/components/writing/draft-room/DraftRoomWorkArea.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { useWriting } from "@hooks/useWriting";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { TagInput, Tag } from "@components/writing/composer/TagInput";
import { CategoryInput, Category } from "@components/writing/composer/CategoryInput";
import { SimplePublishDialog } from "@components/writing/composer/SimplePublishDialog";
import { formatDistanceToNow } from "date-fns";
import { Divider } from "@/components/common/Divider";

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

export default function DraftRoomWorkArea({
  sponsor,
  setActiveSection,
}: DraftRoomWorkAreaProps) {
  const [activeTab, setActiveTab] = useState("drafts");
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

  useEffect(() => {
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
      })
      .catch(() => {
        if (!mounted) return;
        setPieceDetail(null);
      });
    return () => {
      mounted = false;
    };
  }, [selectedPieceSlug]);

  useEffect(() => {
    if (!selectedPieceId) {
      setTags([]);
      setCategories([]);
      return;
    }
    let mounted = true;
    axiosInstance
      .get(`/api/writing/pieces/${selectedPieceId}/tags`)
      .then((res) => {
        if (!mounted) return;
        setTags(res.data || []);
      })
      .catch(() => {
        if (!mounted) return;
        setTags([]);
      });

    axiosInstance
      .get(`/api/writing/pieces/${selectedPieceId}/categories`)
      .then((res) => {
        if (!mounted) return;
        setCategories(res.data || []);
      })
      .catch(() => {
        if (!mounted) return;
        setCategories([]);
      });

    return () => {
      mounted = false;
    };
  }, [selectedPieceId]);

  const handleTagsChange = (newTags: Tag[]) => {
    setTags(newTags);
  };

  const handleCategoriesChange = (newCategories: Category[]) => {
    setCategories(newCategories);
  };

  const handleSaveMetadata = async () => {
    if (!pieceDetail?.id) return;
    setSavingMeta(true);
    try {
      await axiosInstance.patch(`/api/writing/pieces/${pieceDetail.slug}`, {
        title,
        addressed_to: addressedTo || "public",
      });
      titleRef.current = title;
      setShowTitleSaved(true);
      setTimeout(() => setShowTitleSaved(false), 2750);
      await axiosInstance.put(`/api/writing/pieces/${pieceDetail.id}/tags`, {
        tag_ids: tags.map((tag) => tag.id).filter(Boolean),
      });
      await axiosInstance.put(`/api/writing/pieces/${pieceDetail.id}/categories`, {
        category_ids: categories.map((category) => category.id).filter(Boolean),
      });
      persistAddressedTo(addressedTo || "public");
    } finally {
      setSavingMeta(false);
    }
  };

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
            <Text fontSize="lg" fontWeight="semibold">
              Draft Room
            </Text>
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
            <Text fontSize="lg" fontWeight="semibold">
              Draft Room
            </Text>
            <Badge size="sm" variant="outline" colorScheme="blue">
              Series / Audience / Readiness coming soon
            </Badge>
          </HStack>

          <HStack gap={4} fontSize="xs" color={textSecondary}>
            <HStack>
              <Box w="8px" h="8px" borderRadius="full" bg="green.400" />
              <Text>ready</Text>
            </HStack>
            <HStack>
              <Box w="8px" h="8px" borderRadius="full" bg="orange.400" />
              <Text>needs attention</Text>
            </HStack>
          </HStack>

          {!selectedPieceId && (
            <Text fontSize="sm" color={textSecondary}>
              Select a draft to edit its tags, categories, audience, and series.
            </Text>
          )}

          {selectedPieceId && (
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveSection("write", { piece: selectedPieceId })}
                >
                  Edit content
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                  Publish...
                </Button>
              </HStack>

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
                    <Text fontSize="xs" color={textSecondary}>
                      saved
                    </Text>
                  )}
                </HStack>
              </Box>

              <Box>
                <HStack align="center" gap={3} mb={2}>
                  <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={readinessColor(isAudienceReady)}
                  />
                  <Text fontSize="sm" fontWeight="medium">
                    Audience
                  </Text>
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

              <Box>
                <HStack align="center" gap={3} mb={2}>
                  <Box w="8px" h="8px" borderRadius="full" bg={readinessColor(isTagsReady)} />
                  <Text fontSize="sm" fontWeight="medium">
                    Tags
                  </Text>
                  <Box flex="1" />
                  <Tooltip content="This piece OK without tags" portalled={false}>
                    <Box display="inline-flex">
                      <Checkbox.Root
                        size="sm"
                        checked={noneOkTags}
                        onCheckedChange={({ checked }: { checked: boolean | string }) =>
                          setNoneOkTags(!!checked)
                        }
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label>🚫✅</Checkbox.Label>
                      </Checkbox.Root>
                    </Box>
                  </Tooltip>
                </HStack>
                <TagInput
                  selectedTags={tags}
                  onTagsChange={handleTagsChange}
                  maxTags={10}
                  inputSize="sm"
                  inputFontSize="sm"
                  inputBg={inputBg}
                  inputBorderColor={inputBorder}
                  inputFocusBorderColor={inputFocusBorder}
                />
              </Box>

              <Box>
                <HStack align="center" gap={3} mb={2}>
                  <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={readinessColor(isCategoriesReady)}
                  />
                  <Text fontSize="sm" fontWeight="medium">
                    Categories
                  </Text>
                  <Box flex="1" />
                  <Tooltip content="This piece OK without categories" portalled={false}>
                    <Box display="inline-flex">
                      <Checkbox.Root
                        size="sm"
                        checked={noneOkCategories}
                        onCheckedChange={({ checked }: { checked: boolean | string }) =>
                          setNoneOkCategories(!!checked)
                        }
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label>🚫✅</Checkbox.Label>
                      </Checkbox.Root>
                    </Box>
                  </Tooltip>
                </HStack>
                <CategoryInput
                  selectedCategories={categories}
                  onCategoriesChange={handleCategoriesChange}
                  maxCategories={10}
                  inputSize="sm"
                  inputFontSize="sm"
                  inputBg={inputBg}
                  inputBorderColor={inputBorder}
                  inputFocusBorderColor={inputFocusBorder}
                />
              </Box>

              <HStack align="flex-start" gap={4}>
                <Box flex="1">
                  <HStack align="center" gap={3} mb={2}>
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg={readinessColor(isSeriesReady)}
                    />
                    <Text fontSize="sm" fontWeight="medium">
                      Series
                    </Text>
                    <Box flex="1" />
                    <Tooltip content="This piece OK not part of a series" portalled={false}>
                      <Box display="inline-flex">
                        <Checkbox.Root
                          size="sm"
                          checked={noneOkSeries}
                          onCheckedChange={({ checked }: { checked: boolean | string }) =>
                            setNoneOkSeries(!!checked)
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <Checkbox.Label>🚫✅</Checkbox.Label>
                        </Checkbox.Root>
                      </Box>
                    </Tooltip>
                  </HStack>
                  <Input
                    size="sm"
                    value={series}
                    onChange={(event) => setSeries(event.target.value)}
                    placeholder="Coming soon"
                    disabled
                  />
                </Box>
              </HStack>

              <Divider />

              <HStack justify="space-between">
                <Text fontSize="sm" color={textSecondary}>
                  Save metadata updates for this draft.
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveMetadata}
                  disabled={savingMeta}
                >
                  {savingMeta ? "Saving..." : "Save metadata"}
                </Button>
              </HStack>
            </VStack>
          )}
        </VStack>
      </Box>

      {pieceDetail && (
        <SimplePublishDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          piece={{ id: pieceDetail.id, title: pieceDetail.title || "" }}
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

// components/writing/draft-room-v2/DraftInspector.tsx
//
// Right pane: metadata editing, readiness indicators, audience intent,
// tags, categories, and publish controls.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  HStack,
  Select,
  Text,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { TagInput, Tag } from "@components/writing/composer/TagInput";
import { CategoryInput, Category } from "@components/writing/composer/CategoryInput";
import { SimplePublishDialog } from "@components/writing/composer/SimplePublishDialog";
import { ReadinessChecklist } from "./ReadinessChecklist";
import { Divider } from "@/components/common/Divider";

interface PieceState {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  status: string;
  addressedTo: string;
}

interface SponsorConfig {
  type: "member";
  id: string;
  slug: string;
  displayName: string;
}

type DocumentJSON = Record<string, unknown>;

interface DraftInspectorProps {
  piece: PieceState;
  title: string;
  excerpt: string;
  docJSON: DocumentJSON | null;
  hasBody: boolean;
  sponsor: SponsorConfig;
  onPublished?: () => void;
  /** When true, skip outer border/header (used inside tabbed panel) */
  embedded?: boolean;
}

type MetadataSnapshot = {
  title: string;
  addressedTo: string;
  tagIds: string[];
  categoryIds: string[];
};

const audienceCollection = createListCollection({
  items: [
    { label: "Public", value: "public" },
    { label: "Crossroads community", value: "crossroads" },
    { label: "Myself", value: "self" },
  ],
});

export function DraftInspector({
  piece,
  title,
  excerpt,
  docJSON,
  hasBody,
  sponsor,
  onPublished,
  embedded = false,
}: DraftInspectorProps) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("gray.50", "gray.900");
  const labelColor = useColorModeValue("gray.600", "gray.400");

  // Metadata state
  const [addressedTo, setAddressedTo] = useState(piece.addressedTo || "public");
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [noneOkTags, setNoneOkTags] = useState(false);
  const [noneOkCategories, setNoneOkCategories] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Refs for SimplePublishDialog
  const titleRef = useRef(title);
  const docJSONRef = useRef<DocumentJSON | null>(docJSON);
  const excerptRef = useRef(excerpt);
  titleRef.current = title;
  docJSONRef.current = docJSON;
  excerptRef.current = excerpt;

  // Autosave
  const autosaveTimeoutRef = useRef<number | null>(null);
  const lastSavedRef = useRef<MetadataSnapshot | null>(null);
  const hydratingRef = useRef(false);

  // Load tags + categories when piece changes
  useEffect(() => {
    hydratingRef.current = true;
    let mounted = true;

    Promise.all([
      axiosInstance.get(`/api/writing/pieces/${piece.id}/tags`).then((r) => r.data || []).catch(() => []),
      axiosInstance.get(`/api/writing/pieces/${piece.id}/categories`).then((r) => r.data || []).catch(() => []),
    ]).then(([nextTags, nextCategories]) => {
      if (!mounted) return;
      setTags(nextTags);
      setCategories(nextCategories);
      setAddressedTo(piece.addressedTo || "public");
      lastSavedRef.current = {
        title: title.trim(),
        addressedTo: piece.addressedTo || "public",
        tagIds: nextTags.map((t: Tag) => String(t.id)).sort(),
        categoryIds: nextCategories.map((c: Category) => String(c.id)).sort(),
      };
      hydratingRef.current = false;
    });

    return () => { mounted = false; };
  }, [piece.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save metadata
  const saveMetadata = useCallback(async () => {
    if (!piece.id) return;
    setSavingMeta(true);
    try {
      await axiosInstance.patch(`/api/writing/pieces/${piece.slug}`, {
        title,
        addressed_to: addressedTo || "public",
      });
      await axiosInstance.put(`/api/writing/pieces/${piece.id}/tags`, {
        tag_ids: tags.map((t) => t.id),
      });
      await axiosInstance.put(`/api/writing/pieces/${piece.id}/categories`, {
        category_ids: categories.map((c) => c.id),
      });
      lastSavedRef.current = {
        title: title.trim(),
        addressedTo: addressedTo || "public",
        tagIds: tags.map((t) => String(t.id)).sort(),
        categoryIds: categories.map((c) => String(c.id)).sort(),
      };
    } finally {
      setSavingMeta(false);
    }
  }, [piece.id, piece.slug, title, addressedTo, tags, categories]);

  // Autosave on metadata changes (2.5s debounce)
  const currentSnapshot = useMemo<MetadataSnapshot>(
    () => ({
      title: title.trim(),
      addressedTo: addressedTo || "public",
      tagIds: tags.map((t) => String(t.id)).sort(),
      categoryIds: categories.map((c) => String(c.id)).sort(),
    }),
    [title, addressedTo, tags, categories]
  );

  useEffect(() => {
    if (!piece.id || savingMeta || hydratingRef.current) return;
    const last = lastSavedRef.current;
    if (last &&
      last.title === currentSnapshot.title &&
      last.addressedTo === currentSnapshot.addressedTo &&
      last.tagIds.join("|") === currentSnapshot.tagIds.join("|") &&
      last.categoryIds.join("|") === currentSnapshot.categoryIds.join("|")
    ) return;

    if (autosaveTimeoutRef.current) window.clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = window.setTimeout(() => {
      void saveMetadata();
    }, 2500);

    return () => {
      if (autosaveTimeoutRef.current) window.clearTimeout(autosaveTimeoutRef.current);
    };
  }, [currentSnapshot, piece.id, savingMeta, saveMetadata]);

  // Cleanup
  useEffect(() => () => {
    if (autosaveTimeoutRef.current) window.clearTimeout(autosaveTimeoutRef.current);
  }, []);

  // Readiness
  const readinessItems = [
    { label: "Title", isReady: Boolean(title.trim()) },
    { label: "Body", isReady: hasBody },
    { label: "Audience", isReady: Boolean(addressedTo), isOptional: true },
    { label: "Tags", isReady: tags.length > 0, isOptional: true, noneOk: noneOkTags },
    { label: "Categories", isReady: categories.length > 0, isOptional: true, noneOk: noneOkCategories },
    { label: "Excerpt", isReady: Boolean(excerpt.trim()), isOptional: true },
  ];

  return (
    <Box
      h="100%"
      borderLeft={embedded ? "none" : "1px solid"}
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Header — hidden when embedded in tabbed panel */}
      {!embedded && (
        <Box
          px={3}
          py={2}
          borderBottom="1px solid"
          borderColor={borderColor}
          bg={headerBg}
          flexShrink={0}
        >
          <Text fontSize="sm" fontWeight="semibold">
            Inspector
          </Text>
        </Box>
      )}

      {/* Scrollable content */}
      <Box flex="1" overflowY="auto" px={3} py={3}>
        <VStack align="stretch" gap={4}>
          {/* Readiness */}
          <Box>
            <Text fontSize="xs" color={labelColor} mb={1}>
              Readiness
            </Text>
            <ReadinessChecklist items={readinessItems} />
          </Box>

          <Divider />

          {/* Audience */}
          <Box>
            <Text fontSize="xs" color={labelColor} mb={1}>
              Addressed to
            </Text>
            <Select.Root
              collection={audienceCollection}
              value={[addressedTo]}
              onValueChange={(details) => {
                const val = details.value[0];
                if (val) setAddressedTo(val);
              }}
              size="sm"
            >
              <Select.Trigger>
                <Select.ValueText placeholder="Select audience" />
              </Select.Trigger>
              <Select.Content>
                {audienceCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          <Divider />

          {/* Tags */}
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text fontSize="xs" color={labelColor}>Tags</Text>
              <Checkbox.Root
                size="sm"
                checked={noneOkTags}
                onCheckedChange={(details) => setNoneOkTags(Boolean(details.checked))}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>
                  <Text fontSize="xs">none ok</Text>
                </Checkbox.Label>
              </Checkbox.Root>
            </HStack>
            <TagInput
              selectedTags={tags}
              onTagsChange={setTags}
            />
          </Box>

          {/* Categories */}
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text fontSize="xs" color={labelColor}>Categories</Text>
              <Checkbox.Root
                size="sm"
                checked={noneOkCategories}
                onCheckedChange={(details) => setNoneOkCategories(Boolean(details.checked))}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>
                  <Text fontSize="xs">none ok</Text>
                </Checkbox.Label>
              </Checkbox.Root>
            </HStack>
            <CategoryInput
              selectedCategories={categories}
              onCategoriesChange={setCategories}
            />
          </Box>

          <Divider />

          {/* Series placeholder */}
          <Box>
            <Text fontSize="xs" color={labelColor} mb={1}>
              Series
            </Text>
            <Text fontSize="xs" color={labelColor} opacity={0.6}>
              Coming soon
            </Text>
          </Box>

          <Divider />

          {/* Publish */}
          <Button
            size="sm"
            colorPalette="blue"
            onClick={() => setDialogOpen(true)}
          >
            {piece.status === "published" ? "Update publish..." : "Publish..."}
          </Button>

          {savingMeta && (
            <Text fontSize="xs" color={labelColor}>
              Saving metadata...
            </Text>
          )}
        </VStack>
      </Box>

      {dialogOpen && (
        <SimplePublishDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          piece={{ id: piece.id, title }}
          sponsorId={sponsor.id}
          sponsorSlug={sponsor.slug}
          sponsorType={sponsor.type}
          titleRef={titleRef as React.RefObject<string>}
          docJSONRef={docJSONRef as React.RefObject<DocumentJSON | null>}
          excerptRef={excerptRef as React.RefObject<string>}
          isUpdate={piece.status === "published"}
          onPublished={() => {
            setDialogOpen(false);
            onPublished?.();
          }}
        />
      )}
    </Box>
  );
}
